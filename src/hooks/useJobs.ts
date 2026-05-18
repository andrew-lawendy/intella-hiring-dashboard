import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type Job = Database['public']['Tables']['jobs']['Row']

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*').order('department').order('name')
      return (data ?? []) as Job[]
    },
    staleTime: Infinity,
  })
}
