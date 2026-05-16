import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
export type CandidateMeta = Pick<Candidate, 'id' | 'day' | 'name' | 'email' | 'slot'>

export function useCandidateMeta() {
  const [candidates, setCandidates] = useState<CandidateMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('candidates')
      .select('id, day, name, email, slot')
      .order('created_at')
      .then(({ data }) => {
        setCandidates((data ?? []) as CandidateMeta[])
        setLoading(false)
      })
  }, [])

  return { candidates, loading }
}
