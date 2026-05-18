import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Job } from './useJob'

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
