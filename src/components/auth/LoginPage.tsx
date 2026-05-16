import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface LoginPageProps {
  error?: string
}

export function LoginPage({ error }: LoginPageProps) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleMagicLink = async () => {
    if (!email.endsWith('@intellaworld.com')) {
      setEmailError('Must be an @intellaworld.com email address')
      return
    }
    setSending(true)
    setEmailError(null)
    const { error: err } = await signInWithEmail(email)
    setSending(false)
    if (err) {
      setEmailError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left — brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
        style={{
          background: 'radial-gradient(140% 120% at 0% 0%, #4c44c4, #1a1679 60%, #0f0e3d)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.15)',
              boxShadow: '0 1px 0 rgba(255,255,255,.25) inset',
            }}
          />
          <span className="text-white font-semibold text-[18px] tracking-tight">Intella</span>
        </div>

        <div>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.1em] mb-4">
            May 17–21, 2026
          </p>
          <h1 className="text-white text-[36px] font-medium tracking-[-0.03em] leading-[1.15] mb-4">
            Senior PM
            <br />
            Hiring Round
          </h1>
          <p className="text-white/55 text-[15px] leading-relaxed mb-10">
            20 candidates · 5 days · 2 interviewers.
            <br />
            Everything you need to evaluate, compare, and decide — in one place.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Candidate scorecards with feedback blinding',
              'AI-powered debrief summaries',
              'Excel & PDF exports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                <p className="text-white/60 text-[13px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-[12px]">Restricted to @intellaworld.com accounts</p>
      </div>

      {/* Right — sign-in form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div
              className="w-8 h-8 rounded-[8px]"
              style={{
                background: 'radial-gradient(120% 100% at 0% 0%, #4c44c4, #2a2479 70%)',
                boxShadow: '0 1px 0 rgba(255,255,255,.35) inset',
              }}
            />
            <span className="text-text font-semibold text-[17px] tracking-tight">Intella</span>
          </div>

          <h2 className="text-text text-[28px] font-medium tracking-[-0.025em] mb-1">
            Welcome back
          </h2>
          <p className="text-text2 text-[14px] mb-8">
            Enter your Intella email and we'll send you a sign-in link.
          </p>

          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-[var(--radius-sm)] text-[13px] border"
              style={{
                background: 'var(--red-bg)',
                borderColor: 'var(--red-line)',
                color: 'var(--red)',
              }}
            >
              {error}
            </div>
          )}

          {sent ? (
            <div
              className="px-4 py-4 rounded-[var(--radius-sm)] border text-[13px] leading-relaxed"
              style={{
                background: 'var(--green-bg)',
                borderColor: 'var(--green-line)',
                color: 'var(--green)',
              }}
            >
              <p className="font-semibold mb-1">Check your email</p>
              <p className="text-[12px] opacity-80">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                placeholder="you@intellaworld.com"
                className="w-full px-4 py-3 rounded-[var(--radius-sm)] border border-border bg-surface text-text text-[14px] font-sans outline-none focus:border-text transition-colors placeholder:text-text3"
              />
              {emailError && (
                <p className="text-[12px]" style={{ color: 'var(--red)' }}>
                  {emailError}
                </p>
              )}
              <button
                onClick={handleMagicLink}
                disabled={sending || !email}
                className="w-full px-5 py-3 rounded-[var(--radius-sm)] bg-text text-bg text-[14px] font-medium font-sans cursor-pointer hover:opacity-85 disabled:opacity-40 transition-opacity border-none"
              >
                {sending ? 'Sending…' : 'Send magic link'}
              </button>
            </div>
          )}

          <p className="text-text3 text-[12px] text-center mt-6">
            Access restricted to @intellaworld.com accounts
          </p>
        </div>
      </div>
    </div>
  )
}
