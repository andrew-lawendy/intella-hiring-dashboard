import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data as Profile | null
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  })
}

export function useUpsertProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profile: ProfileUpdate & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase as any
      const { error } = await pg.from('profiles').upsert(profile, { onConflict: 'id' })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.id] })
    },
  })
}
