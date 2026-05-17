import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTeamProfiles, displayName } from './useTeamProfiles'

interface CommentRow {
  candidate_id: string
  user_id: string
  body: string
}

export interface CommentEntry {
  userId: string
  name: string
  body: string
  isMe: boolean
}

export function useAllComments(userId: string | undefined) {
  const queryClient = useQueryClient()
  const teamProfiles = useTeamProfiles()

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

  function myCommentFor(candidateId: string): string {
    if (!userId) return ''
    return byCandidate[candidateId]?.[userId] ?? ''
  }

  function allCommentsFor(candidateId: string): CommentEntry[] {
    const byUser = byCandidate[candidateId] ?? {}
    return Object.entries(byUser)
      .filter(([, body]) => body.trim())
      .map(([uid, body]) => ({
        userId: uid,
        name: displayName(teamProfiles[uid], uid.slice(0, 8)),
        body,
        isMe: uid === userId,
      }))
  }

  function coCommentsFor(candidateId: string): string[] {
    return allCommentsFor(candidateId)
      .filter((c) => !c.isMe)
      .map((c) => c.body)
  }

  const { mutateAsync: upsertComment } = useMutation({
    mutationFn: async ({ candidateId, body }: { candidateId: string; body: string }) => {
      if (!userId) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('candidate_comments')
        .upsert(
          { candidate_id: candidateId, user_id: userId, body },
          { onConflict: 'candidate_id,user_id' },
        )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-comments'] }),
  })

  async function setMyComment(candidateId: string, body: string) {
    await upsertComment({ candidateId, body })
  }

  return { byCandidate, myCommentFor, allCommentsFor, coCommentsFor, setMyComment }
}
