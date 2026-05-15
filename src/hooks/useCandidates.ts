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
    async function load() {
      const candidatesRes = await supabase.from('candidates').select('*').order('created_at')
      const profilesRes = await supabase.from('candidate_profiles').select('*')
      const analysisRes = await supabase.from('candidate_analysis').select('*')

      if (candidatesRes.error) {
        setError(candidatesRes.error.message)
        setLoading(false)
        return
      }

      const candidates = (candidatesRes.data ?? []) as Candidate[]
      const profiles = (profilesRes.data ?? []) as Profile[]
      const analyses = (analysisRes.data ?? []) as Analysis[]

      const profileMap: Record<string, Profile> = {}
      for (const p of profiles) {
        profileMap[p.candidate_id] = p
      }

      const analysisMap: Record<string, Analysis> = {}
      for (const a of analyses) {
        analysisMap[a.candidate_id] = a
      }

      setData(
        candidates.map((c) => ({
          candidate: c,
          profile: profileMap[c.id] ?? null,
          analysis: analysisMap[c.id] ?? null,
        })),
      )
      setLoading(false)
    }

    load().catch((err: Error) => {
      setError(err.message)
      setLoading(false)
    })
  }, [])

  return { data, loading, error }
}
