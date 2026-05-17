import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { useHiringRound } from './useHiringRound'

type State = Database['public']['Tables']['interview_state']['Row']
type Scores = Record<string, number>

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
): PipelineStats {
  const totalCount = states.length
  const completedCount = states.filter((s) => s.interview_status === 'completed').length
  const withVerdictCount = states.filter((s) => s.verdict !== null).length
  const scorecardFilledCount = states.filter((s) => {
    const slotA = s.peter_scores as Scores
    const slotB = s.ossama_scores as Scores
    return Object.values(slotA).some((v) => v > 0) || Object.values(slotB).some((v) => v > 0)
  }).length

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
      const { data } = await supabase.from('interview_state').select('*')
      return data ? computePipelineStats(data, new Date(), round?.start_date) : null
    },
    enabled: round !== undefined,
  })

  return stats
}
