import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']
type Scores = {
  Communication: number
  Technical: number
  'Culture Fit': number
  Leadership: number
  Overall: number
}

const ROUND_START = new Date('2026-05-17')

export interface PipelineStats {
  totalCount: number
  completedCount: number
  withVerdictCount: number
  scorecardFilledCount: number
  daysSinceStart: number
}

export function computePipelineStats(states: State[], now: Date): PipelineStats {
  const totalCount = states.length
  const completedCount = states.filter((s) => s.interview_status === 'completed').length
  const withVerdictCount = states.filter((s) => s.verdict !== null).length
  const scorecardFilledCount = states.filter((s) => {
    const ps = s.peter_scores as Scores
    const os = s.ossama_scores as Scores
    return Object.values(ps).some((v) => v > 0) || Object.values(os).some((v) => v > 0)
  }).length
  const daysSinceStart = Math.floor((now.getTime() - ROUND_START.getTime()) / (1000 * 60 * 60 * 24))
  return { totalCount, completedCount, withVerdictCount, scorecardFilledCount, daysSinceStart }
}

export function usePipelineStats() {
  const [stats, setStats] = useState<PipelineStats | null>(null)

  useEffect(() => {
    supabase
      .from('interview_state')
      .select('*')
      .then(({ data }) => {
        if (data) setStats(computePipelineStats(data, new Date()))
      })
  }, [])

  return stats
}
