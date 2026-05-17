import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const FALLBACKS: Record<string, string> = {
  peter: 'Interviewer A',
  ossama: 'Interviewer B',
}

function fullName(first: string | null, last: string | null, fallback: string): string {
  const name = [first, last].filter(Boolean).join(' ')
  return name || fallback
}

export function useInterviewerNames() {
  const { data } = useQuery({
    queryKey: ['interviewer-names'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pg = supabase as any
      const { data: rows } = await pg
        .from('profiles')
        .select('first_name, last_name, scorer_slot')
        .not('scorer_slot', 'is', null)
      return (rows ?? []) as {
        first_name: string | null
        last_name: string | null
        scorer_slot: string
      }[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const nameBySlot: Record<string, string> = { ...FALLBACKS }
  for (const row of data ?? []) {
    if (row.scorer_slot) {
      nameBySlot[row.scorer_slot] = fullName(
        row.first_name,
        row.last_name,
        FALLBACKS[row.scorer_slot] ?? 'Interviewer',
      )
    }
  }

  return (slot: string): string => nameBySlot[slot] ?? 'Interviewer'
}
