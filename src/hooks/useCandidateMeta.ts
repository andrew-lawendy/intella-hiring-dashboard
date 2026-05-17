import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
export type CandidateMeta = Pick<Candidate, 'id' | 'day' | 'name' | 'email' | 'slot'>

export function useCandidateMeta() {
  const { data: candidates = [], isLoading: loading } = useQuery({
    queryKey: ['candidate-meta'],
    queryFn: async () => {
      const { data } = await supabase
        .from('candidates')
        .select('id, day, name, email, slot')
        .order('created_at')
      return (data ?? []) as CandidateMeta[]
    },
  })

  return { candidates, loading }
}
