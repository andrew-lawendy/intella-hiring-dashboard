import type { StateMap } from '@/hooks/useCandidateState'

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
    { num: total, lbl: 'Total Candidates', color: 'var(--text3)' },
    { num: confirmed, lbl: 'Confirmed', color: 'var(--green)' },
    { num: shortlisted, lbl: 'Shortlisted', color: 'var(--brand)' },
    { num: pending, lbl: 'Pending', color: 'var(--amber)' },
    { num: completed, lbl: 'Completed', color: 'var(--blue)' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.lbl}
          className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] transition-all duration-150"
        >
          <div
            className="text-[30px] font-medium tracking-[-0.03em] leading-none font-sans"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {s.num}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-text3">
              {s.lbl}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
