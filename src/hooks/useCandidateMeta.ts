import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
export type CandidateMeta = Pick<
  Candidate,
  'id' | 'day' | 'name' | 'email' | 'slot' | 'seniority' | 'job_id'
>

export function useCandidateMeta(jobId?: number | null) {
  const { data: candidates = [], isLoading: loading } = useQuery({
    queryKey: ['candidate-meta', jobId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('candidates')
        .select('id, day, name, email, slot, seniority, job_id')
        .order('created_at')
      if (jobId != null) query = query.eq('job_id', jobId)
      const { data } = await query
      return (data ?? []) as CandidateMeta[]
    },
  })

  return { candidates, loading }
}
