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
  peter_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 },
  ossama_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 },
  peter_comment: '',
  ossama_comment: '',
  checklist: {},
  photo_url: null,
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
    const stats = computePipelineStats(states, new Date('2026-05-17'))
    expect(stats.completedCount).toBe(2)
    expect(stats.totalCount).toBe(3)
  })

  it('counts candidates with a verdict', () => {
    const states = [
      makeState({ verdict: 'yes' }),
      makeState({ verdict: null }),
      makeState({ verdict: 'no' }),
    ]
    const stats = computePipelineStats(states, new Date('2026-05-17'))
    expect(stats.withVerdictCount).toBe(2)
  })

  it('counts filled scorecards (at least one non-zero score)', () => {
    const states = [
      makeState({
        peter_scores: {
          Communication: 3,
          Technical: 0,
          'Culture Fit': 0,
          Leadership: 0,
          Overall: 0,
        },
      }),
      makeState({
        peter_scores: {
          Communication: 0,
          Technical: 0,
          'Culture Fit': 0,
          Leadership: 0,
          Overall: 0,
        },
      }),
    ]
    const stats = computePipelineStats(states, new Date('2026-05-17'))
    expect(stats.scorecardFilledCount).toBe(1)
  })

  it('calculates days since round opened from May 17 2026', () => {
    const states = [makeState({})]
    const stats = computePipelineStats(states, new Date('2026-05-19'))
    expect(stats.daysSinceStart).toBe(2)
  })
})
