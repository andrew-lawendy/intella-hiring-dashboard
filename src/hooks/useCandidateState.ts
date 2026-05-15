import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'
import { ZERO_SCORES } from '@/lib/scoring'

type InterviewState = Database['public']['Tables']['interview_state']['Row']
export type StateMap = Record<string, InterviewState>

export function useCandidateState() {
  const [stateMap, setStateMap] = useState<StateMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('interview_state')
      .select('*')
      .then(({ data }) => {
        if (data) {
          setStateMap(Object.fromEntries(data.map((s) => [s.candidate_id, s])))
        }
        setLoading(false)
      })
  }, [])

  const updateState = useCallback(async (candidateId: string, patch: Partial<InterviewState>) => {
    setStateMap((prev) => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], ...patch },
    }))
    await supabase.from('interview_state').update(patch).eq('candidate_id', candidateId)
  }, [])

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
    setVerdict,
    setInterviewStatus,
    setShortlisted,
    setConfirmed,
    setScores,
    setComment,
    setChecklist,
  }
}

// Suppress unused import warning
void ZERO_SCORES
