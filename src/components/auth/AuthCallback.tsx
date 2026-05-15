import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email ?? ''
      if (email.endsWith('@intellaworld.com')) {
        navigate('/', { replace: true })
      } else {
        supabase.auth.signOut().then(() => {
          navigate('/login?error=unauthorized', { replace: true })
        })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-text2 font-sans text-sm">Completing sign in...</p>
    </div>
  )
}
