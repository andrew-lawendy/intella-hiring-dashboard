import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTeamProfiles, displayName } from './useTeamProfiles'
import type { Scores } from '@/lib/scoring'

interface ScoreRow {
  candidate_id: string
  user_id: string
  category: string
  value: number
}

export interface ScorerEntry {
  userId: string
  name: string
  scores: Scores
  total: number
  isMe: boolean
}

export function useAllScores(userId: string | undefined) {
  const queryClient = useQueryClient()
  const teamProfiles = useTeamProfiles()

  const { data: rows = [] } = useQuery({
    queryKey: ['all-scores'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('scores').select('*')
      return (data ?? []) as ScoreRow[]
    },
  })

  // Group by candidate → user → category:value
  const byCandidate = useMemo<Record<string, Record<string, Scores>>>(() => {
    const map: Record<string, Record<string, Scores>> = {}
    for (const row of rows) {
      if (!map[row.candidate_id]) map[row.candidate_id] = {}
      if (!map[row.candidate_id][row.user_id]) map[row.candidate_id][row.user_id] = {}
      map[row.candidate_id][row.user_id][row.category] = row.value
    }
    return map
  }, [rows])

  function myScoresFor(candidateId: string): Scores {
    if (!userId) return {}
    return byCandidate[candidateId]?.[userId] ?? {}
  }

  function coScoresFor(candidateId: string): Scores {
    if (!userId) return {}
    const all = byCandidate[candidateId] ?? {}
    const merged: Scores = {}
    for (const [uid, scores] of Object.entries(all)) {
      if (uid === userId) continue
      for (const [cat, val] of Object.entries(scores)) {
        merged[cat] = Math.max(merged[cat] ?? 0, val as number)
      }
    }
    return merged
  }

  // All scorers for a candidate with names resolved
  function allScoresFor(candidateId: string): ScorerEntry[] {
    const byUser = byCandidate[candidateId] ?? {}
    return Object.entries(byUser).map(([uid, scores]) => {
      const total = Object.values(scores).reduce((a, b) => a + (b as number), 0)
      return {
        userId: uid,
        name: displayName(teamProfiles[uid], uid.slice(0, 8)),
        scores,
        total,
        isMe: uid === userId,
      }
    })
  }

  function combinedScoreFor(candidateId: string): number {
    const entries = allScoresFor(candidateId)
    if (!entries.length) return 0
    const totals = entries.map((e) => e.total)
    return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
  }

  const combinedScoreMap = useMemo<Record<string, number>>(
    () => Object.fromEntries(Object.keys(byCandidate).map((id) => [id, combinedScoreFor(id)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byCandidate, teamProfiles],
  )

  const { mutateAsync: upsertScore } = useMutation({
    mutationFn: async ({
      candidateId,
      category,
      value,
    }: {
      candidateId: string
      category: string
      value: number
    }) => {
      if (!userId) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('scores')
        .upsert(
          { candidate_id: candidateId, user_id: userId, category, value },
          { onConflict: 'candidate_id,user_id,category' },
        )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-scores'] }),
  })

  async function setMyScore(candidateId: string, category: string, value: number) {
    await upsertScore({ candidateId, category, value })
  }

  async function setMyScores(candidateId: string, scores: Scores) {
    for (const [category, value] of Object.entries(scores)) {
      await upsertScore({ candidateId, category, value: value as number })
    }
  }

  return {
    byCandidate,
    myScoresFor,
    coScoresFor,
    allScoresFor,
    combinedScoreFor,
    combinedScoreMap,
    setMyScore,
    setMyScores,
  }
}
