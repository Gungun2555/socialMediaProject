/**
 * Fact-checking vocabulary, shared by the UI and the live backend call.
 * Each post's claims are checked against the public record, and the post is
 * resolved down one of three routes —
 *
 *   verified  — at least one claim was confirmed against public sources,
 *               and nothing in the post is inaccurate
 *   disputed  — a claim is contradicted by the public record
 *   hitl      — the claims could not be checked against public sources, so
 *               a human reviewer takes it (human-in-the-loop)
 *
 * Each route can land on any of the three outcomes below. The badge shown
 * on a post is the outcome; the route is *how* that outcome was reached,
 * and is what the fact-check panel on the detail page explains.
 *
 * The actual per-post verdicts come from GET /api/verify, which asks Claude
 * (via AWS Bedrock — see server/verify.mjs) to fact-check each post.
 */

export const STATUS = {
  green: {
    id: 'green',
    label: 'Clear to post',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    ring: 'ring-emerald-500',
  },
  yellow: {
    id: 'yellow',
    label: 'Changes needed',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    ring: 'ring-amber-500',
  },
  red: {
    id: 'red',
    label: 'Remove — flagged false',
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    ring: 'ring-red-500',
  },
  pending: {
    id: 'pending',
    label: 'Verifying…',
    dot: 'bg-slate-400 animate-pulse',
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    ring: 'ring-slate-400',
  },
}

export const ROUTE = {
  verified: {
    id: 'verified',
    label: 'Confirmed by public sources',
    short: 'Verified source',
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
  },
  disputed: {
    id: 'disputed',
    label: 'Contradicted by public record',
    short: 'Disputed',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
  },
  hitl: {
    id: 'hitl',
    label: 'Human-in-the-loop review',
    short: 'HITL review',
    text: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-300',
  },
}

/** Per-claim fact-check verdicts returned by the model. */
export const CLAIM_VERDICT = {
  accurate: {
    id: 'accurate',
    label: 'Accurate',
    icon: '✓',
    text: 'text-emerald-800',
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
  },
  'partly-accurate': {
    id: 'partly-accurate',
    label: 'Partly accurate',
    icon: '≈',
    text: 'text-amber-800',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
  },
  unsupported: {
    id: 'unsupported',
    label: 'Unsupported',
    icon: '?',
    text: 'text-amber-800',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
  },
  inaccurate: {
    id: 'inaccurate',
    label: 'Inaccurate',
    icon: '✕',
    text: 'text-red-700',
    bg: 'bg-red-50/70',
    border: 'border-red-200',
  },
  unverifiable: {
    id: 'unverifiable',
    label: 'Unverifiable',
    icon: '—',
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
}

/** Shown on a tile/detail view while GET /api/verify is in flight. */
export const PENDING_VERIFICATION = {
  status: 'pending',
  route: 'hitl',
  summary: 'Fact-checking this post against public sources with Claude (via AWS Bedrock)…',
  claims: [],
  issues: [],
}

/** Shown if the API call fails — never silently fall back to fake data. */
export function errorVerification(message) {
  return {
    status: 'pending',
    route: 'hitl',
    summary: `Fact-check service unavailable: ${message}`,
    claims: [],
    issues: [],
  }
}
