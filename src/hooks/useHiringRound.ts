import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type HiringRound = Database['public']['Tables']['hiring_rounds']['Row']

export function useHiringRound() {
  return useQuery({
    queryKey: ['hiring-round'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hiring_rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()
      return (data ?? null) as HiringRound | null
    },
    staleTime: Infinity,
  })
}

export function formatRoundDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const month = start.toLocaleDateString('en-US', { month: 'long' })
  return `${month} ${start.getDate()}–${end.getDate()}`
}

export function formatRoundYear(startDate: string): string {
  return new Date(startDate).getFullYear().toString()
}

export function generateDayMap(startDate: string, endDate: string): Record<string, string> {
  const abbrevs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const map: Record<string, string> = {}
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const d = current.getDay()
    map[abbrevs[d]] = `${names[d]} ${current.getDate()} ${months[current.getMonth()]}`
    current.setDate(current.getDate() + 1)
  }

  return map
}
