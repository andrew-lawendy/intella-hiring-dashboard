import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']

interface CardBodyProps {
  candidate: Candidate
}

export function CardBody({ candidate }: CardBodyProps) {
  const rows = [
    { label: 'Interview Slot', value: candidate.slot },
    { label: 'Salary Expectation', value: candidate.salary },
    { label: 'Notice Period', value: candidate.notice },
  ]

  return (
    <div className="px-4 py-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between items-start py-[5px] border-b border-dashed border-border last:border-b-0 text-xs gap-3"
        >
          <span className="text-text2 font-medium text-[12px] uppercase tracking-[0.04em] flex-shrink-0">
            {row.label}
          </span>
          <span
            className="text-text text-right font-[450]"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {row.value ?? '—'}
          </span>
        </div>
      ))}
    </div>
  )
}
