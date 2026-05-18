import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HiringRound } from './useHiringRound'

export function useJobOpenings() {
  return useQuery({
    queryKey: ['job-openings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hiring_rounds')
        .select('*')
        .order('created_at', { ascending: false })
      return (data ?? []) as HiringRound[]
    },
    staleTime: Infinity,
  })
}
