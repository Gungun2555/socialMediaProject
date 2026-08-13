import { StatusBadge } from './ui.jsx'
import { STATUS } from '../lib/verification.js'
import { mediaFor } from '../data.js'

const PLATFORM_ICON = {
  X: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
}

export default function ExploreGrid({ posts, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onClick={() => onSelect(post.id)} />
      ))}
    </div>
  )
}

/** Skeleton placeholders shown on the post containers while the queue page loads. */
export function ExploreGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <div className="aspect-[16/9] w-full animate-pulse bg-sand" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="size-7 flex-none animate-pulse rounded-full bg-sand" />
            <div className="h-3 w-24 animate-pulse rounded bg-sand" />
          </div>
          <div className="h-4 w-14 animate-pulse rounded-full bg-sand" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-sand" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-sand" />
        </div>
        <div className="mt-auto h-7 w-full animate-pulse rounded-lg bg-sand" />
      </div>
    </div>
  )
}

function PostCard({ post, onClick }) {
  const media = mediaFor(post.id)
  const cover = media[0]
  const status = post.verification?.status ?? 'pending'
  const s = STATUS[status] ?? STATUS.pending

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-card text-left shadow-sm outline-none transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg focus-visible:ring-2 focus-visible:ring-sky"
    >
      {/* thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand">
        {cover ? (
          cover.type === 'video' ? (
            <video
              src={cover.url}
              muted
              playsInline
              preload="metadata"
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <img
              src={cover.url}
              alt={post.caption?.slice(0, 60) ?? `Post by @${post.username ?? 'unknown'}`}
              loading="lazy"
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-sky/20 to-navy/30 text-3xl font-bold text-navy/40">
            {(post.username ?? '?').slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* media count badge */}
        {media.length > 1 && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3 opacity-80">
              <rect x="1" y="4" width="10" height="10" rx="1.5" />
              <rect x="5" y="1" width="10" height="10" rx="1.5" opacity="0.5" />
            </svg>
            {media.length}
          </span>
        )}
        {media.length === 1 && media[0].type === 'video' && (
          <span className="absolute top-2.5 left-2.5 grid size-6 place-items-center rounded-md bg-black/50 text-[11px] text-white backdrop-blur-sm">
            ▶
          </span>
        )}

        {/* status badge */}
        <span className="absolute top-2.5 right-2.5">
          <StatusBadge status={status} />
        </span>
      </div>

      {/* card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* identity row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid size-7 flex-none place-items-center rounded-full bg-gradient-to-br from-sky to-navy text-[11px] font-bold text-white">
              {(post.username ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <span className="truncate text-[13px] font-semibold text-ink">@{post.username}</span>
          </div>
          {post.platform && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-sand px-2 py-0.5 text-[11px] font-medium text-muted">
              {PLATFORM_ICON[post.platform] ?? null}
              {post.platform}
            </span>
          )}
        </div>

        {/* caption */}
        {post.caption && (
          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">
            {post.caption}
          </p>
        )}

        {/* status strip */}
        <div className={`mt-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${s.bg} ${s.border}`}>
          <span className={`size-1.5 rounded-full ${s.dot}`} />
          <span className={`text-[11.5px] font-semibold ${s.text}`}>{s.label}</span>
        </div>
      </div>
    </button>
  )
}
