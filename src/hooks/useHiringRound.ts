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

// Parse YYYY-MM-DD as local date to avoid UTC offset shifting the day
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ABBREVS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function formatRoundDateRange(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
}

export function formatRoundYear(startDate: string): string {
  return parseLocalDate(startDate).getFullYear().toString()
}

export function generateDayMap(startDate: string, endDate: string): Record<string, string> {
  const map: Record<string, string> = {}
  const current = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)

  while (current <= end) {
    const d = current.getDay()
    map[DAY_ABBREVS[d]] = `${DAY_NAMES[d]} ${current.getDate()} ${MONTH_NAMES[current.getMonth()]}`
    current.setDate(current.getDate() + 1)
  }

  return map
}

export function getRoundDays(startDate: string, endDate: string): string[] {
  return Object.values(generateDayMap(startDate, endDate))
}
