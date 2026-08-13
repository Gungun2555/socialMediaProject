import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
 *
 * Once the result is in, the panel reveals it piece by piece — badges, then
 * the summary, then the route, then each claim, then each issue — the same
 * way an LLM's answer streams in, so it reads as freshly generated the
 * moment you open the post rather than dumped on screen all at once.
 */
export default function VerificationPanel({ verification }) {
  const { status, route, summary, claims = [], issues = [], reviewer } = verification

  const CLAIMS_START = 3
  const ISSUES_START = CLAIMS_START + claims.length
  const issueSteps = issues.length > 0 ? issues.length : 1
  const totalSteps = ISSUES_START + issueSteps

  // Replays the whole reveal whenever a genuinely different verdict comes in
  // (new post opened, or a re-run produced a new result). Hooks must run
  // unconditionally every render, so this happens before the pending check below.
  const resetKey = `${status}|${route}|${summary}|${claims.length}|${issues.length}`
  const [step, advance] = useSequentialReveal(totalSteps, resetKey)

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
      <AutoAdvance active={step === 0} onDone={advance} delay={200}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={status} />
          <span className="text-muted/40">·</span>
          <RoutePill route={route} />
          {reviewer && <span className="text-xs text-muted/70">Reviewed by {reviewer}</span>}
        </div>
      </AutoAdvance>

      {step >= 1 && (
        <p className="mb-4 text-[13.5px] leading-relaxed text-ink-soft">
          {step === 1 ? <Typewriter text={summary} onDone={advance} /> : summary}
        </p>
      )}

      {step >= 2 && (
        <Fade>
          <div className="mb-4 rounded-xl border border-line/70 bg-sand/50 p-3.5">
            <h4 className="mb-2.5 text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">
              Resolution route — fact-checked live by Claude (AWS Bedrock)
            </h4>
            <RouteStepper active={route} />
          </div>
          <AutoAdvance active={step === 2} onDone={advance} delay={350} />
        </Fade>
      )}

      {claims.length > 0 && step >= CLAIMS_START && (
        <div className="mb-4 space-y-2.5">
          <h4 className="text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">
            Claims checked ({claims.length})
          </h4>
          {claims.map((claim, i) => {
            const claimStep = CLAIMS_START + i
            if (step < claimStep) return null
            return (
              <ClaimRow
                key={i}
                claim={claim}
                active={step === claimStep}
                onDone={advance}
              />
            )
          })}
        </div>
      )}

      {step >= ISSUES_START &&
        (issues.length > 0 ? (
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold tracking-[0.1em] text-muted/60 uppercase">
              Fields needing changes ({issues.length})
            </h4>
            {issues.map((issue, i) => {
              const issueStep = ISSUES_START + i
              if (step < issueStep) return null
              return <IssueRow key={i} issue={issue} active={step === issueStep} onDone={advance} />
            })}
          </div>
        ) : (
          <Fade>
            <p className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-[13px] text-emerald-800">
              No field-level changes required.
            </p>
          </Fade>
        ))}
    </Card>
  )
}

function ClaimRow({ claim, active, onDone }) {
  const verdict = CLAIM_VERDICT[claim.verdict] ?? CLAIM_VERDICT.unverifiable
  const sources = claim.sources ?? []
  // quote -> explanation -> sources -> (parent) next claim
  const [phase, setPhase] = useState(active ? 'quote' : 'done')
  const showExplanation = !active || phase === 'explanation' || phase === 'sources' || phase === 'done'
  const showSources = !active || phase === 'sources' || phase === 'done'

  return (
    <Fade>
      <div className={`rounded-lg border p-3 ${verdict.border} ${verdict.bg}`}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[11px] font-bold ${verdict.border} ${verdict.text}`}
          >
            <span>{verdict.icon}</span>
            {verdict.label}
          </span>
        </div>

        <p className="text-[13.5px] leading-relaxed font-medium text-ink">
          “
          {active && phase === 'quote' ? (
            <Typewriter text={claim.claim} onDone={() => setPhase(claim.explanation ? 'explanation' : 'sources')} />
          ) : (
            claim.claim
          )}
          ”
        </p>

        {claim.explanation && showExplanation && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            {active && phase === 'explanation' ? (
              <Typewriter text={claim.explanation} onDone={() => setPhase('sources')} />
            ) : (
              claim.explanation
            )}
          </p>
        )}

        {showSources &&
          (sources.length > 0 ? (
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
          ))}

        {active && phase === 'sources' && <AutoAdvance active onDone={onDone} delay={350} />}
      </div>
    </Fade>
  )
}

function IssueRow({ issue, active, onDone }) {
  return (
    <Fade>
      <div className="rounded-lg border border-amber-warn/25 bg-amber-warn/[0.06] p-3">
        <span className="mb-1.5 inline-block rounded-full border border-line bg-card px-2 py-0.5 text-[11px] font-bold text-ink">
          {issue.field}
        </span>
        <p className="text-[13.5px] leading-relaxed text-ink-soft">
          {active ? <Typewriter text={issue.message} onDone={onDone} /> : issue.message}
        </p>
      </div>
    </Fade>
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

/** Drives the panel through its reveal steps one at a time, replaying from 0 whenever `resetKey` changes. */
function useSequentialReveal(totalSteps, resetKey) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
  }, [resetKey])
  const advance = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps))
  }, [totalSteps])
  return [step, advance]
}

/** Fires onDone once, `delay`ms after mount — a brief "thinking" pause between reveal steps. */
function AutoAdvance({ active = true, onDone, delay = 250, children = null }) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => onDoneRef.current?.(), delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, delay])
  return children
}

/** Fades new content in rather than having it pop in instantly. */
function Fade({ children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>{children}</div>
}

/**
 * Reveals `text` word by word with a blinking caret, like a streaming LLM
 * response, then calls onDone after a short pause once fully shown.
 */
function Typewriter({ text, onDone, speed = 16 }) {
  const tokens = useMemo(() => text?.match(/\S+\s*/g) ?? (text ? [text] : []), [text])
  const [count, setCount] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    setCount(0)
    if (!tokens.length) {
      onDoneRef.current?.()
      return
    }
    let cancelled = false
    let i = 0
    let timer
    const step = () => {
      if (cancelled) return
      i += 1
      setCount(i)
      if (i < tokens.length) {
        timer = setTimeout(step, speed + Math.random() * 26)
      } else {
        timer = setTimeout(() => onDoneRef.current?.(), 200)
      }
    }
    timer = setTimeout(step, speed)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const done = count >= tokens.length
  return (
    <span>
      {tokens.slice(0, count).join('')}
      {!done && (
        <span className="ml-0.5 inline-block h-3.5 w-[3px] translate-y-[2px] animate-pulse bg-sky/70 align-middle" />
      )}
    </span>
  )
}
