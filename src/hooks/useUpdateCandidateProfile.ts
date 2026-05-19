// src/hooks/useUpdateCandidateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fitLabelFromScore } from '@/lib/scoring'
import type { Database } from '@/lib/database.types'

type ProfileUpdate = Database['public']['Tables']['candidate_profiles']['Update']

export function useUpdateCandidateProfile(candidateId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      const update = { ...patch }
      if (update.fit_score != null) {
        update.fit_label = fitLabelFromScore(update.fit_score)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidate_profiles')
        .update(update)
        .eq('candidate_id', candidateId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
