import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { CheckCircle2Icon, MailIcon } from 'lucide-react'

interface LoginPageProps {
  error?: string
}

const PREVIEW_CARDS = [
  { name: 'Sarah Chen', role: 'Senior Product Manager', score: '87/100', verdict: 'Strong Yes' },
  { name: 'James Okafor', role: 'Group PM · FinTech', score: '74/100', verdict: 'Yes' },
  { name: 'Layla Hassan', role: 'Principal PM · B2B SaaS', score: '81/100', verdict: 'Strong Yes' },
  { name: 'Marco Ferretti', role: 'PM Lead · Marketplace', score: '68/100', verdict: 'Maybe' },
  { name: 'Priya Nair', role: 'Senior PM · Growth', score: '79/100', verdict: 'Yes' },
  { name: 'David Kim', role: 'Director of Product', score: '91/100', verdict: 'Strong Yes' },
  { name: 'Ana Sousa', role: 'PM · Platform', score: '62/100', verdict: 'Maybe' },
]

const VERDICT_STYLES: Record<string, string> = {
  'Strong Yes': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Yes: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  Maybe: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
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
    <div className="min-h-screen flex">
      {/* Left — sign-in form */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="size-8 rounded-lg bg-primary flex-shrink-0" />
            <span className="text-foreground font-semibold text-[17px] tracking-tight">
              Intella
            </span>
          </div>

          <h2 className="text-foreground text-[28px] font-semibold tracking-[-0.025em] mb-1">
            Welcome back
          </h2>
          <p className="text-muted-foreground text-[14px] mb-8">
            Enter your Intella email and we'll send you a sign-in link.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sent ? (
            <Alert variant="success" className="py-4">
              <CheckCircle2Icon className="size-4" />
              <div>
                <p className="font-semibold text-sm mb-1">Check your email</p>
                <p className="text-xs opacity-80">
                  We sent a magic link to <strong>{email}</strong>. Click it to sign in.
                </p>
              </div>
            </Alert>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                  placeholder="you@intellaworld.com"
                  className="pl-9 pr-4 py-3 h-auto rounded-md bg-background text-foreground text-[14px] font-sans"
                />
              </div>
              {emailError && <p className="text-[12px] text-destructive">{emailError}</p>}
              <Button
                onClick={handleMagicLink}
                disabled={sending || !email}
                loading={sending}
                className="w-full py-3 h-auto text-[14px]"
              >
                {sending ? 'Sending…' : 'Send magic link'}
              </Button>
            </div>
          )}

          <p className="text-muted-foreground text-[12px] text-center mt-6">
            Access restricted to @intellaworld.com accounts
          </p>
        </div>
      </div>

      {/* Right — brand aside */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 overflow-hidden relative"
        style={{ background: 'var(--color-teal-950)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="size-9 rounded-xl bg-white/15 ring-1 ring-white/25 flex-shrink-0" />
          <span className="text-white font-semibold text-[18px] tracking-tight">Intella</span>
        </div>

        {/* Headline + card preview */}
        <div className="z-10">
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.1em] mb-5">
            May 2026 Hiring Round
          </p>
          <h1 className="text-white text-[34px] font-semibold tracking-[-0.03em] leading-[1.15] mb-10">
            Hiring at Intella, <em className="not-italic text-white/60">in one place.</em>
          </h1>

          {/* Animated card scroll */}
          <div className="relative h-[260px] overflow-hidden rounded-xl mb-10">
            <div
              className="flex flex-col gap-3"
              style={{
                animation: 'scroll-cards 18s linear infinite',
              }}
            >
              {[...PREVIEW_CARDS, ...PREVIEW_CARDS].map((card, i) => (
                <div
                  key={i}
                  className="bg-white/8 border border-white/12 rounded-lg px-4 py-3 flex items-center justify-between backdrop-blur-sm"
                >
                  <div>
                    <p className="text-white text-[13px] font-medium">{card.name}</p>
                    <p className="text-white/50 text-[11px] mt-0.5">{card.role}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white/60 font-mono text-[11px]">{card.score}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${VERDICT_STYLES[card.verdict] ?? ''}`}
                    >
                      {card.verdict}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Fade top & bottom */}
            <div
              className="absolute inset-x-0 top-0 h-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, var(--color-teal-950), transparent)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{ background: 'linear-gradient(to top, var(--color-teal-950), transparent)' }}
            />
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-2.5">
            {[
              'Candidate scorecards with feedback blinding',
              'AI-powered debrief summaries',
              'Excel & PDF export',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="size-1.5 rounded-full bg-white/35 flex-shrink-0" />
                <p className="text-white/55 text-[13px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-[12px] z-10">Restricted to @intellaworld.com accounts</p>

        <style>{`
          @keyframes scroll-cards {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}</style>
      </aside>
    </div>
  )
}
