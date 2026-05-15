import type { StateMap } from '@/hooks/useCandidateState'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']

const DAYS = [
  'Sunday 17 May',
  'Monday 18 May',
  'Tuesday 19 May',
  'Wednesday 20 May',
  'Thursday 21 May',
]
const DAY_LABELS = ['Sun 17', 'Mon 18', 'Tue 19', 'Wed 20', 'Thu 21']

function getTodayLabel(): string {
  const now = new Date()
  const date = now.getDate()
  const month = now.getMonth() // 0-indexed
  if (month !== 4) return ''
  const map: Record<number, string> = {
    17: 'Sunday 17 May',
    18: 'Monday 18 May',
    19: 'Tuesday 19 May',
    20: 'Wednesday 20 May',
    21: 'Thursday 21 May',
  }
  return map[date] ?? ''
}

interface InterviewTimelineProps {
  candidates: Candidate[]
  stateMap: StateMap
}

export function InterviewTimeline({ candidates, stateMap: _stateMap }: InterviewTimelineProps) {
  const counts = DAYS.map((day) => candidates.filter((c) => c.day === day).length)
  const maxCount = Math.max(...counts, 1)
  const today = getTodayLabel()
  const todayIdx = DAYS.indexOf(today)

  return (
    <div className="grid grid-cols-5 mb-6 bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
      {DAYS.map((day, i) => {
        const isPast = todayIdx >= 0 && i < todayIdx
        const isToday = i === todayIdx
        const count = counts[i]
        const fillPct = Math.round((count / maxCount) * 100)

        return (
          <div
            key={day}
            className={[
              'px-4 py-3.5 border-r border-border last:border-r-0 flex flex-col gap-1.5 relative transition-colors duration-150 hover:bg-surface2',
              isToday ? 'bg-gradient-to-b from-[var(--amber-bg)] to-transparent' : '',
            ].join(' ')}
          >
            {isToday && (
              <span className="absolute top-2.5 right-3 text-[9px] font-bold tracking-[0.1em] text-[var(--amber)]">
                TODAY
              </span>
            )}
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text3">
              {DAY_LABELS[i]}
            </span>
            <span
              className="text-[26px] font-medium leading-none tracking-[-0.03em]"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {count}
            </span>
            <div className="h-[3px] rounded-full bg-surface3 overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${fillPct}%`,
                  background: isPast ? 'var(--green)' : isToday ? 'var(--amber)' : 'var(--text)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
