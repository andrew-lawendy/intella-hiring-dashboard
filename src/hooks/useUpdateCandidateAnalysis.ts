// src/hooks/useUpdateCandidateAnalysis.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AnalysisUpdate = Database['public']['Tables']['candidate_analysis']['Update']

export function useUpdateCandidateAnalysis(candidateId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: AnalysisUpdate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidate_analysis')
        .update(patch)
        .eq('candidate_id', candidateId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
