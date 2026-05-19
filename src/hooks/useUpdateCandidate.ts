// src/hooks/useUpdateCandidate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type CandidateUpdate = Database['public']['Tables']['candidates']['Update']

export function useUpdateCandidate(candidateId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: CandidateUpdate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidates')
        .update(patch)
        .eq('id', candidateId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate-meta'] })
    },
  })
}
