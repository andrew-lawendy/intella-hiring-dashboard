import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { VERDICTS } from '@/lib/verdicts'

type Status = Database['public']['Tables']['interview_state']['Row']['interview_status']
type Verdict = Database['public']['Tables']['interview_state']['Row']['verdict']

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'pending', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Done' },
]

const VERDICT_OPTIONS: { value: NonNullable<Verdict>; label: string }[] = VERDICTS.map((v) => ({
  value: v.value,
  label: v.short,
}))

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
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text3 mr-1">
          Status:
        </span>
        {STATUS_OPTIONS.map((s) => (
          <Button
            key={s.value}
            size="xs"
            variant={status === s.value ? 'default' : 'outline'}
            onClick={() => onStatusChange(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text3 mr-1">
          Verdict:
        </span>
        {VERDICT_OPTIONS.map((v) => (
          <Button
            key={v.value}
            size="xs"
            variant={verdict === v.value ? 'default' : 'outline'}
            onClick={() => onVerdictChange(v.value)}
          >
            {v.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
