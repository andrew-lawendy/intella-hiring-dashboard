import type { StateMap } from '@/hooks/useCandidateState'
import { StatsCard } from '@/components/ui/stats-card'

interface SummaryBarProps {
  total: number
  stateMap: StateMap
}

export function SummaryBar({ total, stateMap }: SummaryBarProps) {
  const states = Object.values(stateMap)
  const confirmed = states.filter((s) => s.confirmed).length
  const shortlisted = states.filter((s) => s.shortlisted === true).length
  const pending = states.filter((s) => s.interview_status === 'pending').length
  const completed = states.filter((s) => s.interview_status === 'completed').length

  const stats = [
    { num: total, lbl: 'Total Candidates' },
    { num: confirmed, lbl: 'Confirmed' },
    { num: shortlisted, lbl: 'Shortlisted' },
    { num: pending, lbl: 'Pending' },
    { num: completed, lbl: 'Completed' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <StatsCard key={s.lbl} title={s.lbl} value={s.num} size="sm" variant="filled" />
      ))}
    </div>
  )
}
