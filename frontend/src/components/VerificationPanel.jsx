import { Card, RoutePill, RouteStepper, StatusPill } from './ui.jsx'
import { CLAIM_VERDICT } from '../lib/verification.js'

/**
 * Shows *why* a post got its badge: each checkable claim pulled out of the
 * post, whether the public record supports it, the sources cited for it, and
 * field by field what needs to change.
 *
 * The verdict comes from a live call to Claude via AWS Bedrock
 * (GET /api/verify, see server/verify.mjs). The model has no web access, so
 * every source URL it returns is probed server-side; links that did not
 * resolve are marked rather than presented as verified.
 */
export default function VerificationPanel({ verification }) {
  const { status, route, summary, claims = [], issues = [], reviewer } = verification

  if (status === 'pending') {
    return (
      <Card title="Fact check">
        <div className="flex items-center gap-2.5">
          <span className="size-2 animate-pulse rounded-full bg-slate-400" />
          <p className="text-[13.5px] text-muted">{summary}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Fact check">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill status={status} />
        <span className="text-muted/40">·</span>
        <RoutePill route={route} />
        {reviewer && <span className="text-xs text-muted/70">Reviewed by {reviewer}</span>}
      </div>

      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-soft">{summary}</p>

      <div className="mb-4 rounded-xl border border-line/70 bg-sand/50 p-3.5">
        <h4 className="mb-2.5 text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">
          Resolution route — fact-checked live by Claude (AWS Bedrock)
        </h4>
        <RouteStepper active={route} />
      </div>

      {claims.length > 0 && (
        <div className="mb-4 space-y-2.5">
          <h4 className="text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">
            Claims checked ({claims.length})
          </h4>
          {claims.map((claim, i) => (
            <ClaimRow key={i} claim={claim} />
          ))}
        </div>
      )}

      {issues.length > 0 ? (
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">
            Fields needing changes ({issues.length})
          </h4>
          {issues.map((issue, i) => (
            <div key={i} className="rounded-lg border border-amber-warn/25 bg-amber-warn/[0.06] p-3">
              <span className="mb-1.5 inline-block rounded-full border border-line bg-card px-2 py-0.5 text-[11px] font-bold text-ink">
                {issue.field}
              </span>
              <p className="text-[13.5px] leading-relaxed text-ink-soft">{issue.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-[13px] text-emerald-800">
          No field-level changes required.
        </p>
      )}
    </Card>
  )
}

function ClaimRow({ claim }) {
  const verdict = CLAIM_VERDICT[claim.verdict] ?? CLAIM_VERDICT.unverifiable
  const sources = claim.sources ?? []

  return (
    <div className={`rounded-lg border p-3 ${verdict.border} ${verdict.bg}`}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[11px] font-bold ${verdict.border} ${verdict.text}`}
        >
          <span>{verdict.icon}</span>
          {verdict.label}
        </span>
      </div>

      <p className="text-[13.5px] leading-relaxed font-medium text-ink">“{claim.claim}”</p>
      {claim.explanation && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{claim.explanation}</p>
      )}

      {sources.length > 0 ? (
        <div className="mt-2.5 space-y-1">
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">Sources</p>
          <ul className="space-y-1">
            {sources.map((source, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-1.5 text-[12.5px]">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium break-all text-navy underline-offset-2 hover:underline"
                >
                  {source.title || source.url}
                </a>
                {source.publisher && <span className="text-muted/70">· {source.publisher}</span>}
                <LinkState reachable={source.reachable} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-muted/70 italic">No public source could be cited for this claim.</p>
      )}
    </div>
  )
}

/** Whether the cited URL actually resolved when the server probed it. */
function LinkState({ reachable }) {
  if (reachable === undefined) return null
  return reachable ? (
    <span
      title="This URL resolved when the server checked it"
      className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
    >
      link ok
    </span>
  ) : (
    <span
      title="This URL did not resolve when the server checked it — treat it as unconfirmed"
      className="rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700"
    >
      link dead
    </span>
  )
}
