import { useState } from 'react'
import Logo from './Logo.jsx'

export const DEMO_PASSWORD = 'kaidoko@@2026'

export default function Login({ onSignIn, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const name = username.trim()
    if (!name || !password) {
      setError('Please enter both a username and a password.')
      return
    }
    if (password !== DEMO_PASSWORD) {
      setError('Incorrect password. Please try again.')
      return
    }
    setError('')
    onSignIn(name)
  }

  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden bg-canvas p-6">
      {/* decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-sky opacity-10 blur-[80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-navy opacity-10 blur-[80px]"
      />

      <div className="relative w-full max-w-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-navy"
          >
            <svg viewBox="0 0 16 16" className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13L5 8l5-5" />
            </svg>
            Back to home
          </button>
        )}

        <div className="rounded-3xl border border-line bg-card shadow-2xl shadow-sky/10">
          {/* header band */}
          <div className="flex flex-col items-center gap-4 rounded-t-3xl bg-gradient-to-br from-sky to-navy px-8 py-10 text-white">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
              <Logo className="size-10" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                True<span className="text-sky-light">post</span>
              </h1>
              <p className="mt-1 text-[13px] text-white/70">
                Social post claim verification
              </p>
            </div>
          </div>

          {/* form body */}
          <div className="px-8 py-8">
            <p className="mb-6 text-center text-[13px] text-muted">
              Sign in to access the verification dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Field
                label="Username"
                id="username"
                value={username}
                onChange={setUsername}
                placeholder="analyst"
                autoComplete="username"
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H3Z" />
                  </svg>
                }
              />

              <div>
                <label htmlFor="password" className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-muted/70">
                    Password
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/50">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-line bg-sand py-2.5 pr-10 pl-9 text-sm text-ink outline-none transition placeholder:text-muted/40 focus:border-sky focus:bg-card focus:ring-3 focus:ring-sky/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted/50 transition hover:text-muted"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                          <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                          <path d="M10.748 13.93l2.523 2.524a10.023 10.023 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="mt-px size-4 shrink-0 text-red-500">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full cursor-pointer rounded-xl bg-gradient-to-br from-sky to-navy py-3 text-sm font-semibold text-white shadow-md shadow-sky/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky/50 active:scale-[.98]"
              >
                Sign in
              </button>
            </form>

            <p className="mt-6 text-center text-[11px] text-muted/60">
              This is a demo — credentials are provided separately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, id, value, onChange, icon, ...rest }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-muted/70">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/50">
            {icon}
          </span>
        )}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-line bg-sand py-2.5 pr-3 pl-9 text-sm text-ink outline-none transition placeholder:text-muted/40 focus:border-sky focus:bg-card focus:ring-3 focus:ring-sky/20"
          {...rest}
        />
      </div>
    </label>
  )
}
