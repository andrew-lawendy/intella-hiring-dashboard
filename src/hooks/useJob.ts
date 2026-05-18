import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type Job = Database['public']['Tables']['jobs']['Row']

export function useJob(id?: number | null) {
  return useQuery({
    queryKey: ['job', id ?? null],
    queryFn: async () => {
      if (!id) return null
      const { data } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle()
      return (data ?? null) as Job | null
    },
    staleTime: Infinity,
  })
}
