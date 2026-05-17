import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'

type InterviewState = Database['public']['Tables']['interview_state']['Row']
type InterviewStateUpdate = Database['public']['Tables']['interview_state']['Update']
export type StateMap = Record<string, InterviewState>

// Internal type — maps scorer profile slots to DB column names
type ScorerSlot = 'peter' | 'ossama'

function scoresKey(slot: ScorerSlot): 'peter_scores' | 'ossama_scores' {
  return slot === 'peter' ? 'peter_scores' : 'ossama_scores'
}

function commentKey(slot: ScorerSlot): 'peter_comment' | 'ossama_comment' {
  return slot === 'peter' ? 'peter_comment' : 'ossama_comment'
}

export function getSlotScores(state: InterviewState, slot: string): Scores {
  return (slot === 'peter' ? state.peter_scores : state.ossama_scores) as Scores
}

export function getCoSlotScores(state: InterviewState, slot: string): Scores {
  return (slot === 'peter' ? state.ossama_scores : state.peter_scores) as Scores
}

export function getSlotComment(state: InterviewState, slot: string): string {
  return slot === 'peter' ? state.peter_comment : state.ossama_comment
}

export function getCoSlotComment(state: InterviewState, slot: string): string {
  return slot === 'peter' ? state.ossama_comment : state.peter_comment
}

export function useCandidateState() {
  const queryClient = useQueryClient()

  const { data: stateMap = {}, isLoading: loading } = useQuery({
    queryKey: ['interview-state'],
    queryFn: async () => {
      const { data } = await supabase.from('interview_state').select('*')
      const rows = (data ?? []) as InterviewState[]
      const map: StateMap = {}
      for (const s of rows) map[s.candidate_id] = s
      return map
    },
  })

  const updateState = useCallback(
    async (candidateId: string, patch: InterviewStateUpdate) => {
      queryClient.setQueryData<StateMap>(['interview-state'], (prev = {}) => ({
        ...prev,
        [candidateId]: { ...prev[candidateId], ...patch },
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase.from('interview_state') as any
      await pg.update(patch).eq('candidate_id', candidateId)
    },
    [queryClient],
  )

  const setVerdict = useCallback(
    (id: string, verdict: InterviewState['verdict']) => {
      const current = stateMap[id]?.verdict
      updateState(id, { verdict: current === verdict ? null : verdict })
    },
    [stateMap, updateState],
  )

  const setInterviewStatus = useCallback(
    (id: string, status: InterviewState['interview_status']) =>
      updateState(id, { interview_status: status }),
    [updateState],
  )

  const setShortlisted = useCallback(
    (id: string, value: boolean | null) => updateState(id, { shortlisted: value }),
    [updateState],
  )

  const setConfirmed = useCallback(
    (id: string, value: boolean) => updateState(id, { confirmed: value }),
    [updateState],
  )

  const setScoresBySlot = useCallback(
    (id: string, slot: string, scores: Scores) =>
      updateState(id, { [scoresKey(slot as ScorerSlot)]: scores }),
    [updateState],
  )

  const setCommentBySlot = useCallback(
    (id: string, slot: string, comment: string) =>
      updateState(id, { [commentKey(slot as ScorerSlot)]: comment }),
    [updateState],
  )

  const setChecklist = useCallback(
    (id: string, checklist: Record<string, boolean>) => updateState(id, { checklist }),
    [updateState],
  )

  return {
    stateMap,
    loading,
    updateState,
    setVerdict,
    setInterviewStatus,
    setShortlisted,
    setConfirmed,
    setScoresBySlot,
    setCommentBySlot,
    setChecklist,
  }
}
