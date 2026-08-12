import { ROUTE, STATUS } from '../lib/verification.js'

const STATUS_ICON = { green: '✓', yellow: '!', red: '✕', pending: '⋯' }

/** Small colored dot + icon, meant to sit over a media thumbnail. */
export function StatusBadge({ status, size = 'md' }) {
  const s = STATUS[status] ?? STATUS.yellow
  const dims = size === 'sm' ? 'size-5 text-[10px]' : 'size-7 text-xs'
  return (
    <span
      title={s.label}
      className={`grid ${dims} flex-none place-items-center rounded-full font-bold text-white shadow-[0_1px_4px_rgba(0,0,0,0.35)] ring-2 ring-white ${s.dot}`}
    >
      {STATUS_ICON[s.id]}
    </span>
  )
}

/** Full pill with label, used in cards/headers rather than over media. */
export function StatusPill({ status }) {
  const s = STATUS[status] ?? STATUS.yellow
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-bold ${s.border} ${s.bg} ${s.text}`}
    >
      <span className={`size-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function RoutePill({ route }) {
  const r = ROUTE[route] ?? ROUTE.hitl
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${r.border} ${r.bg} ${r.text}`}
    >
      {r.short}
    </span>
  )
}

/** Horizontal 3-step flow showing which backend check produced this result. */
export function RouteStepper({ active }) {
  const order = ['verified', 'disputed', 'hitl']
  return (
    <div className="flex flex-wrap items-center gap-2">
      {order.map((key, i) => {
        const r = ROUTE[key]
        const isActive = key === active
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                isActive ? `${r.border} ${r.bg} ${r.text}` : 'border-line bg-sand text-muted/60'
              }`}
            >
              {r.label}
            </span>
            {i < order.length - 1 && <span className="text-muted/40">→</span>}
          </div>
        )
      })}
    </div>
  )
}

export function Card({ title, children, className = '' }) {
  return (
    <section className={`mb-4 rounded-2xl border border-line bg-card p-5 sm:p-6 ${className}`}>
      {title && (
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted/70">
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}

const pillTones = {
  neutral: 'border-line bg-sand text-muted',
  accent: 'border-sky/35 bg-sky/10 text-navy',
  warn: 'border-amber-warn/35 bg-amber-warn/10 text-amber-warn',
}

export function Pill({ children, tone = 'neutral' }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${pillTones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted/60">
        {label}
      </div>
      <div className="text-sm break-words text-ink">{children ?? '—'}</div>
    </div>
  )
}

export function MetaGrid({ children, className = '' }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>
}

export function Chips({ items, tone = 'brand', empty = 'None.' }) {
  if (!items?.length) return <p className="text-sm italic text-muted/60">{empty}</p>
  const cls = tone === 'hash' ? 'border-navy/40 text-navy' : 'border-sky text-navy'
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full border bg-sand px-3 py-1 text-xs ${cls}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

export function EmptyState({ children }) {
  return <div className="py-20 text-center text-sm text-muted/70">{children}</div>
}

export function Disclosure({ summary, children }) {
  return (
    <details className="group rounded-lg border border-line/70 bg-sand/60 open:bg-sand">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-muted transition select-none group-open:text-ink">
        <span className="mr-1.5 inline-block transition group-open:rotate-90">›</span>
        {summary}
      </summary>
      <div className="border-t border-line/70 px-3 py-3">{children}</div>
    </details>
  )
}
