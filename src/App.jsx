import { useEffect, useMemo, useState } from 'react'
import LandingPage from './components/LandingPage.jsx'
import Login from './components/Login.jsx'
import RecordView from './components/RecordView.jsx'
import ExploreGrid from './components/ExploreGrid.jsx'
import { EmptyState } from './components/ui.jsx'
import { PENDING_VERIFICATION, STATUS, errorVerification } from './lib/verification.js'
import { fetchVerification } from './lib/api.js'
import { posts } from './data.js'

const FILTERS = [
  { id: 'all', label: 'All posts' },
  { id: 'green', label: STATUS.green.label },
  { id: 'yellow', label: STATUS.yellow.label },
  { id: 'red', label: STATUS.red.label },
]

const SESSION_KEY = 'socialveri.session'

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')?.user ?? null
    } catch {
      return null
    }
  })

  const [showLogin, setShowLogin] = useState(false)
  const [postId, setPostId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const [verificationMap, setVerificationMap] = useState({})
  const [verifyState, setVerifyState] = useState('idle') // idle | loading | ready | error
  const [verifyError, setVerifyError] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [linkCheck, setLinkCheck] = useState(null)

  async function loadVerification({ refresh = false } = {}) {
    setVerifyState('loading')
    setVerifyError(null)
    try {
      const { data, generatedAt, linkCheck } = await fetchVerification({ refresh })
      setVerificationMap(data ?? {})
      setGeneratedAt(generatedAt ?? null)
      setLinkCheck(linkCheck ?? null)
      setVerifyState('ready')
    } catch (err) {
      setVerifyError(err.message ?? 'Verification failed')
      setVerifyState('error')
    }
  }

  useEffect(() => {
    if (user) loadVerification()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const postsWithVerification = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        verification:
          verificationMap[post.id] ??
          (verifyState === 'error' ? errorVerification(verifyError) : PENDING_VERIFICATION),
      })),
    [verificationMap, verifyState, verifyError],
  )

  const counts = useMemo(
    () =>
      postsWithVerification.reduce(
        (acc, post) => {
          const status = post.verification.status
          acc[status] = (acc[status] ?? 0) + 1
          acc.all += 1
          return acc
        },
        { all: 0, green: 0, yellow: 0, red: 0, pending: 0 },
      ),
    [postsWithVerification],
  )

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return postsWithVerification.filter((post) => {
      if (statusFilter !== 'all' && post.verification.status !== statusFilter) return false
      if (!q) return true
      return (
        post.username?.toLowerCase().includes(q) ||
        post.platform?.toLowerCase().includes(q) ||
        post.caption?.toLowerCase().includes(q) ||
        post.hashtags?.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [postsWithVerification, statusFilter, query])

  function signIn(name) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: name, at: new Date().toISOString() }))
    setUser(name)
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  // landing page first; the sign-in card is one click away from any of its CTAs
  if (!user) {
    return showLogin ? (
      <Login onSignIn={signIn} onBack={() => setShowLogin(false)} />
    ) : (
      <LandingPage onGetStarted={() => setShowLogin(true)} />
    )
  }

  const activePost = postId ? postsWithVerification.find((post) => post.id === postId) : null

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      {/* top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-card/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <img src="/truepost-logo.png" alt="Truepost" className="size-8 object-contain" draggable={false} />
          <span className="text-[17px] font-bold tracking-tight">
            True<span className="text-sky">post</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <VerifyStatus
            state={verifyState}
            error={verifyError}
            generatedAt={generatedAt}
            linkCheck={linkCheck}
            onRefresh={() => loadVerification({ refresh: true })}
          />
          <div className="hidden h-5 w-px bg-line sm:block" />
          <span className="hidden text-[13px] text-muted sm:inline">
            <strong className="font-semibold text-ink">{user}</strong>
          </span>
          <button
            onClick={signOut}
            className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 pb-16">
        {activePost ? (
          <div className="mx-auto max-w-[1400px] p-3 sm:p-6">
            <RecordView record={activePost} onBack={() => setPostId(null)} />
          </div>
        ) : (
          <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
            {/* page heading */}
            <div className="mb-6">
              <h1 className="text-[22px] font-bold tracking-tight text-ink">Content moderation queue</h1>
              <p className="mt-1 text-[13px] text-muted">
                Every post fact-checked claim by claim · publicly available sources cited at a glance
              </p>
            </div>

            {/* stat dashboard */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Total posts"
                count={counts.all}
                active={statusFilter === 'all'}
                accent="from-sky to-navy"
                dotColor="bg-sky"
                onClick={() => setStatusFilter('all')}
              />
              <StatCard
                label={STATUS.green.label}
                count={counts.green}
                active={statusFilter === 'green'}
                accent="from-emerald-400 to-emerald-600"
                dotColor="bg-emerald-500"
                onClick={() => setStatusFilter('green')}
              />
              <StatCard
                label={STATUS.yellow.label}
                count={counts.yellow}
                active={statusFilter === 'yellow'}
                accent="from-amber-400 to-amber-600"
                dotColor="bg-amber-500"
                onClick={() => setStatusFilter('yellow')}
              />
              <StatCard
                label={STATUS.red.label}
                count={counts.red}
                active={statusFilter === 'red'}
                accent="from-red-400 to-red-600"
                dotColor="bg-red-500"
                onClick={() => setStatusFilter('red')}
              />
            </div>

            {/* filters + search */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                      statusFilter === f.id
                        ? 'border-sky bg-sky text-white shadow-sm shadow-sky/30'
                        : 'border-line bg-card text-muted hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <label className="relative w-full max-w-xs sm:w-64">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted/50">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-4">
                    <circle cx="9" cy="9" r="5.5" />
                    <path d="m15 15-2.5-2.5" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search username, tag, platform…"
                  className="w-full rounded-full border border-line bg-card py-2 pr-3.5 pl-9 text-[13px] text-ink outline-none transition placeholder:text-muted/50 focus:border-sky focus:ring-3 focus:ring-sky/20"
                />
              </label>
            </div>

            {visiblePosts.length ? (
              <ExploreGrid posts={visiblePosts} onSelect={setPostId} />
            ) : (
              <EmptyState>No posts match this filter.</EmptyState>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function VerifyStatus({ state, error, generatedAt, linkCheck, onRefresh }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-[12px]">
      {state === 'loading' && (
        <>
          <span className="size-2 animate-pulse rounded-full bg-sky" />
          <span className="hidden text-muted sm:inline">Fact-checking…</span>
        </>
      )}
      {state === 'ready' && (
        <>
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="hidden text-muted sm:inline">
            {generatedAt && new Date(generatedAt).toLocaleTimeString()}
            {linkCheck?.checked > 0 && (
              <span className="text-muted/60"> · {linkCheck.reachable}/{linkCheck.checked} sources</span>
            )}
          </span>
        </>
      )}
      {state === 'error' && (
        <>
          <span className="size-2 rounded-full bg-red-500" />
          <span className="hidden max-w-40 truncate text-red-600 sm:inline" title={error}>{error}</span>
        </>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={state === 'loading'}
        className="cursor-pointer rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold text-muted transition hover:border-sky hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        Re-run
      </button>
    </div>
  )
}

function StatCard({ label, count, accent, dotColor, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-card p-5 text-left transition ${
        active
          ? 'border-transparent shadow-lg ring-2 ring-sky/30'
          : 'border-line hover:border-line-strong hover:shadow-md'
      }`}
    >
      {/* top gradient bar */}
      <span className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${accent}`} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted/70">{label}</p>
          <p className="mt-2 text-[32px] font-extrabold leading-none tracking-tight text-ink">{count}</p>
        </div>
        <span className={`mt-1 size-2.5 rounded-full ${dotColor} opacity-70`} />
      </div>
    </button>
  )
}
