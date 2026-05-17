import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'

type InterviewState = Database['public']['Tables']['interview_state']['Row']
type InterviewStateUpdate = Database['public']['Tables']['interview_state']['Update']
export type StateMap = Record<string, InterviewState>

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

  const setScores = useCallback(
    (id: string, scorer: 'peter' | 'ossama', scores: Scores) => {
      const key = scorer === 'peter' ? 'peter_scores' : 'ossama_scores'
      updateState(id, { [key]: scores })
    },
    [updateState],
  )

  const setComment = useCallback(
    (id: string, scorer: 'peter' | 'ossama', comment: string) => {
      const key = scorer === 'peter' ? 'peter_comment' : 'ossama_comment'
      updateState(id, { [key]: comment })
    },
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
    setScores,
    setComment,
    setChecklist,
  }
}
