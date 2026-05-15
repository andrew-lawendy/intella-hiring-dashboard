import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

export interface CandidateWithDetails {
  candidate: Candidate
  profile: Profile | null
  analysis: Analysis | null
}

export function useCandidates() {
  const [data, setData] = useState<CandidateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*').order('created_at'),
      supabase.from('candidate_profiles').select('*'),
      supabase.from('candidate_analysis').select('*'),
    ])
      .then(([candidatesRes, profilesRes, analysisRes]) => {
        if (candidatesRes.error) throw candidatesRes.error
        const profileMap = Object.fromEntries(
          (profilesRes.data ?? []).map((p) => [p.candidate_id, p]),
        )
        const analysisMap = Object.fromEntries(
          (analysisRes.data ?? []).map((a) => [a.candidate_id, a]),
        )
        setData(
          (candidatesRes.data ?? []).map((c) => ({
            candidate: c,
            profile: profileMap[c.id] ?? null,
            analysis: analysisMap[c.id] ?? null,
          })),
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
