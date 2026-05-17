import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface CommentRow {
  candidate_id: string
  user_id: string
  body: string
}

export function useAllComments(userId: string | undefined) {
  const queryClient = useQueryClient()

  const { data: rows = [] } = useQuery({
    queryKey: ['all-comments'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('candidate_comments').select('*')
      return (data ?? []) as CommentRow[]
    },
  })

  const byCandidate = useMemo<Record<string, Record<string, string>>>(() => {
    const map: Record<string, Record<string, string>> = {}
    for (const row of rows) {
      if (!map[row.candidate_id]) map[row.candidate_id] = {}
      map[row.candidate_id][row.user_id] = row.body
    }
    return map
  }, [rows])

  const { mutateAsync: upsertComment } = useMutation({
    mutationFn: async ({ candidateId, body }: { candidateId: string; body: string }) => {
      if (!userId) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase as any
      await pg
        .from('candidate_comments')
        .upsert(
          { candidate_id: candidateId, user_id: userId, body },
          { onConflict: 'candidate_id,user_id' },
        )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-comments'] })
    },
  })

  function myCommentFor(candidateId: string): string {
    if (!userId) return ''
    return byCandidate[candidateId]?.[userId] ?? ''
  }

  function coCommentsFor(candidateId: string): string[] {
    if (!userId) return []
    const all = byCandidate[candidateId] ?? {}
    return Object.entries(all)
      .filter(([uid]) => uid !== userId)
      .map(([, body]) => body)
      .filter(Boolean)
  }

  async function setMyComment(candidateId: string, body: string) {
    await upsertComment({ candidateId, body })
  }

  return { byCandidate, myCommentFor, coCommentsFor, setMyComment }
}
