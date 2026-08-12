/**
 * post/posts.json is the only dataset the UI browses; each record is
 *   { id, username, caption, hashtags[], links[], platform }
 *
 * It is imported at build time, so the app runs with `npm run dev` and as a
 * static build alike. Only the fact-check verdicts are fetched at runtime.
 */

import postsData from '../post/posts.json'

/**
 * Media lives in images/<record id>/, e.g. images/post_001/01.png.
 * The glob resolves every file to a bundled URL; records with no folder
 * simply have no media.
 */
const mediaModules = import.meta.glob(
  '../images/*/*.{png,jpg,jpeg,gif,webp,avif,svg,mp4,webm,mov,m4v}',
  { eager: true, query: '?url', import: 'default' },
)

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

const mediaByRecord = {}
for (const [path, url] of Object.entries(mediaModules)) {
  const match = path.match(/\/images\/([^/]+)\/([^/]+)$/)
  if (!match) continue
  const [, recordId, file] = match
  mediaByRecord[recordId] ??= []
  mediaByRecord[recordId].push({ file, url, type: VIDEO_EXT.test(file) ? 'video' : 'image' })
}

// 01.png, 02.png … 10.png in the order a human would expect
for (const list of Object.values(mediaByRecord)) {
  list.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))
}

export const mediaFor = (recordId) => mediaByRecord[recordId] ?? []

const withSource = (records, source) =>
  records.map((record, i) => ({ ...record, _source: source, _key: record.id ?? `${source}-${i}` }))

/**
 * Plain post records — no verification attached here. Verdicts come back
 * async from GET /api/verify (a live Claude/Bedrock call, see
 * server/verify.mjs) and are merged in by App.jsx once they arrive.
 */
export const posts = withSource(postsData, 'post/posts.json')
