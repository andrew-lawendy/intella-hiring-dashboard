import { useQuery } from '@tanstack/react-query'
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
  ids?: string[]
}

async function fetchCandidates(ids?: string[]): Promise<CandidateWithDetails[]> {
  if (ids !== undefined && ids.length === 0) return []

  let candidatesQuery = supabase.from('candidates').select('*').order('created_at')
  if (ids) candidatesQuery = candidatesQuery.in('id', ids)

  const candidatesRes = await candidatesQuery
  if (candidatesRes.error) throw new Error(candidatesRes.error.message)

  const candidates = candidatesRes.data as Candidate[]
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

  return candidates.map((c) => ({
    candidate: c,
    profile: profileMap[c.id] ?? null,
    analysis: analysisMap[c.id] ?? null,
  }))
}

export function useCandidates(options?: UseCandidatesOptions) {
  const ids = options?.ids
  const idsKey = ids?.join(',') ?? 'all'

  const {
    data = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['candidates', idsKey],
    queryFn: () => fetchCandidates(ids),
    enabled: ids === undefined || ids.length > 0,
  })

  return { data, loading, error: queryError ? (queryError as Error).message : null }
}
