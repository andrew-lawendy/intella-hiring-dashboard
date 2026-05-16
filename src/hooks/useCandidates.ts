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

interface UseCandidatesOptions {
  // When provided, only fetch full data for these candidate IDs (paginated subset)
  ids?: string[]
}

export function useCandidates(options?: UseCandidatesOptions) {
  const [data, setData] = useState<CandidateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable key so the effect only re-runs when the ID list content changes
  const idsKey = options?.ids?.join(',') ?? 'all'

  useEffect(() => {
    const ids = options?.ids

    // Nothing to fetch for an empty page
    if (ids !== undefined && ids.length === 0) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)

    async function load() {
      let candidatesQuery = supabase.from('candidates').select('*').order('created_at')
      if (ids) {
        candidatesQuery = candidatesQuery.in('id', ids)
      }

      const candidatesRes = await candidatesQuery

      if (candidatesRes.error) {
        setError(candidatesRes.error.message)
        setLoading(false)
        return
      }

      const candidates = (candidatesRes.data ?? []) as Candidate[]
      const candidateIds = candidates.map((c) => c.id)

      const [profilesRes, analysisRes] = await Promise.all([
        supabase.from('candidate_profiles').select('*').in('candidate_id', candidateIds),
        supabase.from('candidate_analysis').select('*').in('candidate_id', candidateIds),
      ])

      const profiles = (profilesRes.data ?? []) as Profile[]
      const analyses = (analysisRes.data ?? []) as Analysis[]

      const profileMap: Record<string, Profile> = {}
      for (const p of profiles) profileMap[p.candidate_id] = p

      const analysisMap: Record<string, Analysis> = {}
      for (const a of analyses) analysisMap[a.candidate_id] = a

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  return { data, loading, error }
}
