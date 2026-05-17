import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, session, isIntellaUser } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!session || !isIntellaUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
