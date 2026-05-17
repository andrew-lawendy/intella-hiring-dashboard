import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface InterviewerNames {
  peter: string
  ossama: string
}

function fullName(first: string | null, last: string | null, fallback: string): string {
  const name = [first, last].filter(Boolean).join(' ')
  return name || fallback
}

export function useInterviewerNames(): InterviewerNames {
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

  const peter = data?.find((r) => r.scorer_slot === 'peter')
  const ossama = data?.find((r) => r.scorer_slot === 'ossama')

  return {
    peter: fullName(peter?.first_name ?? null, peter?.last_name ?? null, 'Peter'),
    ossama: fullName(ossama?.first_name ?? null, ossama?.last_name ?? null, 'Ossama'),
  }
}
