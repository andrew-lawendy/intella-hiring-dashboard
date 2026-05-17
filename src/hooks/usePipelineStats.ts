import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { useHiringRound } from './useHiringRound'

type State = Database['public']['Tables']['interview_state']['Row']

export interface PipelineStats {
  totalCount: number
  completedCount: number
  withVerdictCount: number
  scorecardFilledCount: number
  daysSinceStart: number
}

export function computePipelineStats(
  states: State[],
  now: Date,
  roundStartDate?: string,
  scoredCandidateIds: Set<string> = new Set(),
): PipelineStats {
  const totalCount = states.length
  const completedCount = states.filter((s) => s.interview_status === 'completed').length
  const withVerdictCount = states.filter((s) => s.verdict !== null).length
  const scorecardFilledCount = states.filter((s) => scoredCandidateIds.has(s.candidate_id)).length

  let daysSinceStart = 0
  if (roundStartDate) {
    const [y, m, d] = roundStartDate.split('-').map(Number)
    const start = new Date(y, m - 1, d)
    daysSinceStart = Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    )
  }

  return { totalCount, completedCount, withVerdictCount, scorecardFilledCount, daysSinceStart }
}

export function usePipelineStats() {
  const { data: round } = useHiringRound()

  const { data: stats = null } = useQuery({
    queryKey: ['pipeline-stats', round?.start_date],
    queryFn: async () => {
      const [{ data: states }, { data: scores }] = await Promise.all([
        supabase.from('interview_state').select('*'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('scores').select('candidate_id'),
      ])

      const scoredIds = new Set<string>(
        (scores ?? []).map((r: { candidate_id: string }) => r.candidate_id),
      )

      return states ? computePipelineStats(states, new Date(), round?.start_date, scoredIds) : null
    },
    enabled: round !== undefined,
  })

  return stats
}
