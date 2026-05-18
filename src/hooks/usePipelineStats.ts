import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

export interface PipelineStats {
  totalCount: number
  completedCount: number
  withVerdictCount: number
  scorecardFilledCount: number
}

export function computePipelineStats(
  states: State[],
  scoredCandidateIds: Set<string> = new Set(),
): PipelineStats {
  return {
    totalCount: states.length,
    completedCount: states.filter((s) => s.interview_status === 'completed').length,
    withVerdictCount: states.filter((s) => s.verdict !== null).length,
    scorecardFilledCount: states.filter((s) => scoredCandidateIds.has(s.candidate_id)).length,
  }
}

export function usePipelineStats(jobId?: number | null) {
  const { data: stats = null } = useQuery({
    queryKey: ['pipeline-stats', jobId ?? null],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const statesQuery = jobId
        ? supabase
            .from('interview_state')
            .select('*, candidates!inner(job_id)')
            .eq('candidates.job_id', jobId)
        : supabase.from('interview_state').select('*')

      const [{ data: states }, { data: scores }] = await Promise.all([
        statesQuery,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('scores').select('candidate_id'),
      ])

      const scoredIds = new Set<string>(
        (scores ?? []).map((r: { candidate_id: string }) => r.candidate_id),
      )

      return states ? computePipelineStats(states as State[], scoredIds) : null
    },
  })

  return stats
}
