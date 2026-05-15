import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, session, isIntellaUser } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-surface3 border-t-text rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !isIntellaUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
