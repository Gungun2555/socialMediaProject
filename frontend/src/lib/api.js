/**
 * Talks to GET /api/verify.
 *
 * - Development: Vite proxy forwards /api → http://localhost:3001
 * - Production (Cloudflare Pages): VITE_API_URL is set to the Render backend
 *   e.g. https://truepost-backend.onrender.com
 */
const BASE = import.meta.env.VITE_API_URL ?? ''

export async function fetchVerification({ refresh = false } = {}) {
  const res = await fetch(`${BASE}/api/verify${refresh ? '?refresh=1' : ''}`)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  }
  return body
}
