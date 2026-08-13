import { useEffect, useState } from 'react'
import { Card, Chips, Meta, MetaGrid, Pill, StatusPill } from './ui.jsx'
import { splitCaption, renderInline, captionSnippet } from '../lib/format.jsx'
import { mediaFor } from '../data.js'
import VerificationPanel from './VerificationPanel.jsx'

/**
 * Post detail view. The fact-check panel — each claim, its sources, and the
 * fields that need changing — sits beside the post it judges (caption,
 * hashtags/links, media) on wide screens, and above it on narrow ones.
 */
export default function RecordView({ record, onBack }) {
  const { notice, paragraphs } = splitCaption(record.caption)
  const media = mediaFor(record.id)

  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-navy"
        >
          ‹ Back to explore
        </button>
      )}

      {notice && (
        <div className="mb-4 rounded-xl border border-amber-warn/25 bg-amber-warn/[0.07] px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          <strong className="font-bold text-amber-warn">Synthetic sample. </strong>
          {notice}
        </div>
      )}

      {/* identity */}
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-full bg-gradient-to-br from-sky/20 to-navy/30 text-sm font-bold text-navy">
            {(record.username ?? '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight">@{record.username ?? 'unknown'}</h2>
            <p className="mt-1.5 max-w-md truncate text-[13px] text-muted/80">
              {captionSnippet(record.caption, 90)}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {record.verification && <StatusPill status={record.verification.status} />}
            <Pill tone="accent">{record.platform}</Pill>
            <Pill>{mediaLabel(media)}</Pill>
            <Pill>{record.hashtags?.length ?? 0} hashtags</Pill>
            <Pill>{record.links?.length ?? 0} links</Pill>
          </div>
        </div>
      </Card>

      {/* fact check beside the post it judges, once there is room for both */}
      <div className="grid items-start xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] xl:gap-5">
        <div>
          {record.verification && <VerificationPanel verification={record.verification} />}
        </div>

        <div>
          {/* caption */}
          <Card title="Caption / text">
            <div className="space-y-3">
              {paragraphs.map((text, i) => (
                <p
                  key={i}
                  className="text-[14.5px] leading-relaxed whitespace-pre-line text-ink-soft"
                >
                  {renderInline(text)}
                </p>
              ))}
            </div>
          </Card>

          {/* hashtags & links */}
          <Card title="Hashtags & links">
            <MetaGrid>
              <Meta label="Hashtags">
                <Chips items={record.hashtags} tone="hash" empty="No hashtags on this record." />
              </Meta>
              <Meta label="Links">
                {record.links?.length ? (
                  <ul className="space-y-1">
                    {record.links.map((link) => (
                      <li key={link}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-navy underline-offset-2 hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-muted/60">No links attached.</span>
                )}
              </Meta>
            </MetaGrid>
          </Card>

          {/* media attached to this post */}
          <Card title="Media">
            {media.length > 0 ? (
              <MediaCarousel key={record.id} items={media} />
            ) : (
              <p className="text-sm italic text-muted/60">No media attached to this post.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function mediaLabel(media) {
  if (!media.length) return 'no media'
  const videos = media.filter((item) => item.type === 'video').length
  const images = media.length - videos
  return [images && `${images} image${images > 1 ? 's' : ''}`, videos && `${videos} video`]
    .filter(Boolean)
    .join(' · ')
}

function MediaCarousel({ items }) {
  const [index, setIndex] = useState(0)
  const current = items[index]

  // arrow keys move through the carousel once it has focus
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items.length])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Pill tone="accent">{`${index + 1} / ${items.length}`}</Pill>
        {items.length > 1 && (
          <div className="ml-auto flex gap-2">
            <NavButton disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ‹ Prev
            </NavButton>
            <NavButton
              disabled={index === items.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Next ›
            </NavButton>
          </div>
        )}
      </div>

      <div className="grid place-items-center rounded-xl border border-line bg-sand p-3">
        {current.type === 'video' ? (
          <video
            key={current.url}
            controls
            playsInline
            preload="metadata"
            src={current.url}
            className="max-h-[560px] w-full rounded-lg bg-black"
          />
        ) : (
          <Frame src={current.url} alt="Post media" />
        )}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <button
              key={item.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show item ${i + 1}`}
              aria-current={i === index}
              className={`relative size-16 cursor-pointer overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-sky' : 'border-line hover:border-line-strong'
              }`}
            >
              {item.type === 'video' ? (
                <span className="grid size-full place-items-center bg-sand text-lg">▶</span>
              ) : (
                <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NavButton({ children, ...rest }) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-lg border border-line px-3 py-1 text-xs font-semibold text-muted transition hover:border-sky hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-muted"
      {...rest}
    >
      {children}
    </button>
  )
}

function Frame({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="grid min-h-44 w-full place-items-center rounded-lg border border-dashed border-line p-6 text-center text-xs text-muted">
        Could not load {src}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="max-h-[560px] w-auto max-w-full rounded-lg"
    />
  )
}
