import { Fragment } from 'react'

const MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

/**
 * Captions carry inline markdown links, e.g. "[@meta](https://instagram.com/meta/)".
 * Returns an array of strings and <a> elements ready to drop into JSX.
 */
export function renderInline(text = '') {
  const out = []
  let last = 0
  let match

  MD_LINK.lastIndex = 0
  while ((match = MD_LINK.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index))
    out.push(
      <a
        key={`${match.index}-${match[2]}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-navy underline-offset-2 hover:underline"
      >
        {match[1]}
      </a>,
    )
    last = match.index + match[0].length
  }
  if (last < text.length) out.push(text.slice(last))

  return out.map((part, i) => <Fragment key={i}>{part}</Fragment>)
}

/**
 * Splits a caption into paragraphs, pulling off a leading
 * "[SYNTHETIC SAMPLE — ...]" line so the viewer can flag it.
 */
export function splitCaption(caption = '') {
  const paragraphs = caption.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const first = paragraphs[0] ?? ''

  if (/^\[SYNTHETIC SAMPLE/i.test(first)) {
    // "[SYNTHETIC SAMPLE — fictional parties]" -> "Fictional parties"
    const notice = first
      .replace(/^\[SYNTHETIC SAMPLE\s*[—-]?\s*/i, '')
      .replace(/\]$/, '')
      .replace(/^./, (c) => c.toUpperCase())
    return { notice, paragraphs: paragraphs.slice(1) }
  }
  return { notice: null, paragraphs }
}

/** A short, single-line label for dropdown options. */
export function captionSnippet(caption = '', max = 64) {
  const { paragraphs } = splitCaption(caption)
  const line = (paragraphs[0] ?? caption).split('\n')[0].replace(MD_LINK, '$1').trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}
