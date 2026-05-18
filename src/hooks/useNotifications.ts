import { useMemo } from 'react'
import { useCandidateMeta } from './useCandidateMeta'
import { useCandidateState } from './useCandidateState'
import { useAllScores } from './useAllScores'
import { useAuth } from './useAuth'
import { deriveActionItems, type ActionItem } from '@/lib/actionQueue'

export function useNotifications(jobId?: number | null): ActionItem[] {
  const { candidates } = useCandidateMeta(jobId)
  const { stateMap } = useCandidateState()
  const { user } = useAuth()
  const { byCandidate } = useAllScores(user?.id)

  const myScoresMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(byCandidate).map(([cid, byUser]) => [cid, byUser[user?.id ?? ''] ?? {}]),
      ),
    [byCandidate, user?.id],
  )

  const stateMin = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(stateMap).map(([id, s]) => [
          id,
          {
            confirmed: s.confirmed,
            interview_status: s.interview_status,
            verdict: s.verdict,
          },
        ]),
      ),
    [stateMap],
  )

  return useMemo(
    () =>
      deriveActionItems(
        candidates
          .filter((c) => c.job_id != null)
          .map((c) => ({
            id: c.id,
            name: c.name,
            slot: c.slot,
            jobId: c.job_id as number,
          })),
        stateMin,
        myScoresMap,
      ),
    [candidates, stateMin, myScoresMap],
  )
}
