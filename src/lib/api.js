/**
 * Talks to the dev/preview-only /api/verify endpoint (see vite.config.js +
 * server/verify.mjs). Returns { data: { [postId]: verification }, generatedAt }.
 */
export async function fetchVerification({ refresh = false } = {}) {
  const res = await fetch(`/api/verify${refresh ? '?refresh=1' : ''}`)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  }
  return body
}
