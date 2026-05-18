import { describe, it, expect } from 'vitest'
import { computePipelineStats } from '../usePipelineStats'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

const makeState = (overrides: Partial<State>): State => ({
  candidate_id: 'x',
  confirmed: false,
  shortlisted: null,
  interview_status: 'pending',
  verdict: null,
  checklist: {},
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('computePipelineStats', () => {
  it('counts completed interviews', () => {
    const states = [
      makeState({ interview_status: 'completed' }),
      makeState({ interview_status: 'completed' }),
      makeState({ interview_status: 'pending' }),
    ]
    const stats = computePipelineStats(states)
    expect(stats.completedCount).toBe(2)
    expect(stats.totalCount).toBe(3)
  })

  it('counts candidates with a verdict', () => {
    const states = [
      makeState({ verdict: 'yes' }),
      makeState({ verdict: null }),
      makeState({ verdict: 'no' }),
    ]
    const stats = computePipelineStats(states)
    expect(stats.withVerdictCount).toBe(2)
  })

  it('counts filled scorecards from scores map', () => {
    const states = [makeState({ candidate_id: 'a' }), makeState({ candidate_id: 'b' })]
    const scoredIds = new Set(['a'])
    const stats = computePipelineStats(states, scoredIds)
    expect(stats.scorecardFilledCount).toBe(1)
  })
})
