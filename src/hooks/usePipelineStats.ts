import { useQuery } from '@tanstack/react-query'
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

export function usePipelineStats() {
  const { data: stats = null } = useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      const [{ data: states }, { data: scores }] = await Promise.all([
        supabase.from('interview_state').select('*'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('scores').select('candidate_id'),
      ])

      const scoredIds = new Set<string>(
        (scores ?? []).map((r: { candidate_id: string }) => r.candidate_id),
      )

      return states ? computePipelineStats(states, scoredIds) : null
    },
  })

  return stats
}
