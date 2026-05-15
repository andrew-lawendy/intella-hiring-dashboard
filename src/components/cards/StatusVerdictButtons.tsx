import type { Database } from '@/lib/database.types'

type Status = Database['public']['Tables']['interview_state']['Row']['interview_status']
type Verdict = Database['public']['Tables']['interview_state']['Row']['verdict']

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'pending', label: 'Not Started', color: 'var(--text3)' },
  { value: 'in-progress', label: 'In Progress', color: 'var(--amber)' },
  { value: 'completed', label: 'Done', color: 'var(--green)' },
]

const VERDICT_OPTIONS: { value: NonNullable<Verdict>; label: string; color: string }[] = [
  { value: 'strong-yes', label: '⭐ Strong Yes', color: 'var(--green)' },
  { value: 'yes', label: '✓ Yes', color: 'var(--blue)' },
  { value: 'maybe', label: '? Maybe', color: 'var(--amber)' },
  { value: 'no', label: '✗ No', color: 'var(--red)' },
]

interface Props {
  status: Status
  verdict: Verdict
  onStatusChange: (s: Status) => void
  onVerdictChange: (v: NonNullable<Verdict>) => void
}

export function StatusVerdictButtons({ status, verdict, onStatusChange, onVerdictChange }: Props) {
  return (
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text3 mr-1">
          Status:
        </span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-all font-sans border"
            style={
              status === s.value
                ? { background: s.color, color: '#fff', borderColor: s.color }
                : { background: 'none', color: 'var(--text2)', borderColor: 'var(--border)' }
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text3 mr-1">
          Verdict:
        </span>
        {VERDICT_OPTIONS.map((v) => (
          <button
            key={v.value}
            onClick={() => onVerdictChange(v.value)}
            className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-all font-sans border"
            style={
              verdict === v.value
                ? { background: v.color, color: '#fff', borderColor: v.color }
                : { background: 'none', color: 'var(--text2)', borderColor: 'var(--border)' }
            }
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
