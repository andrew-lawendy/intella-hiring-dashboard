import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

interface LoginPageProps {
  error?: string
}

export function LoginPage({ error }: LoginPageProps) {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[var(--radius)] p-8 shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-8 h-8 rounded-[7px] flex-shrink-0"
            style={{
              background: 'radial-gradient(120% 100% at 0% 0%, #4c44c4, #2a2479 70%)',
              boxShadow: '0 1px 0 rgba(255,255,255,.35) inset, 0 4px 12px -4px rgba(42,36,121,.5)',
            }}
          />
          <div>
            <p className="text-text font-sans font-semibold text-[17px] leading-none tracking-tight">
              Intella
            </p>
            <p className="text-text3 font-sans text-[13px] mt-0.5">Interview Dashboard</p>
          </div>
        </div>

        <h1 className="text-text font-sans font-semibold text-xl tracking-tight mb-1">Sign in</h1>
        <p className="text-text2 font-sans text-sm mb-6">
          Use your @intellaworld.com Google account.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-bg border border-red-line rounded-[var(--radius-xs)] text-red text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={signInWithGoogle}
          className="w-full bg-text text-bg hover:bg-text2 border-0 font-medium"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
