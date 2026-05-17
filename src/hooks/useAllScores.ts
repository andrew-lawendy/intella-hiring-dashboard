import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Scores } from '@/lib/scoring'

interface ScoreRow {
  candidate_id: string
  user_id: string
  category: string
  value: number
}

type ScoresByCandidate = Record<string, Record<string, Scores>>

export function useAllScores(userId: string | undefined) {
  const queryClient = useQueryClient()

  const { data: rows = [] } = useQuery({
    queryKey: ['all-scores'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('scores').select('*')
      return (data ?? []) as ScoreRow[]
    },
  })

  const byCandidate = useMemo<ScoresByCandidate>(() => {
    const map: ScoresByCandidate = {}
    for (const row of rows) {
      if (!map[row.candidate_id]) map[row.candidate_id] = {}
      if (!map[row.candidate_id][row.user_id]) map[row.candidate_id][row.user_id] = {}
      map[row.candidate_id][row.user_id][row.category] = row.value
    }
    return map
  }, [rows])

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
      const pg = supabase as any
      await pg
        .from('scores')
        .upsert(
          { candidate_id: candidateId, user_id: userId, category, value },
          { onConflict: 'candidate_id,user_id,category' },
        )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-scores'] })
    },
  })

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

  function combinedScoreFor(candidateId: string): number {
    const all = byCandidate[candidateId] ?? {}
    const totals = Object.values(all).map((scores) =>
      Object.values(scores).reduce((a, b) => a + (b as number), 0),
    )
    if (!totals.length) return 0
    return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
  }

  // Flat map: candidateId → combined score (for analytics/exports)
  const combinedScoreMap = useMemo<Record<string, number>>(() => {
    return Object.fromEntries(Object.keys(byCandidate).map((id) => [id, combinedScoreFor(id)]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCandidate])

  async function setMyScores(candidateId: string, scores: Scores) {
    for (const [category, value] of Object.entries(scores)) {
      await upsertScore({ candidateId, category, value: value as number })
    }
  }

  return {
    byCandidate,
    myScoresFor,
    coScoresFor,
    combinedScoreFor,
    combinedScoreMap,
    setMyScores,
  }
}
