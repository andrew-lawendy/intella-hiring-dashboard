import { useCandidates } from '@/hooks/useCandidates'
import { formatSalary, salaryToEGP, sortBySalary } from '@/lib/salary'
import { Spinner } from '@/components/ui/spinner'

export function SalaryPage() {
  const { data, loading } = useCandidates()

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const sorted = sortBySalary(
    data.map((d) => d.candidate),
    (c) => c,
  )

  const maxVal = Math.max(
    ...sorted.map((c) => salaryToEGP(c.salary_amount, c.salary_currency, c.salary_period) ?? 0),
    1,
  )

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Salary Chart</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        All values normalised to monthly EGP equivalent (USD × 50). TBD excluded from ranking.
      </p>

      <div className="bg-surface border border-border rounded-[var(--radius)] p-6 shadow-[var(--shadow-sm)]">
        {sorted.map((candidate, i) => {
          const egp = salaryToEGP(
            candidate.salary_amount,
            candidate.salary_currency,
            candidate.salary_period,
          )
          const pct = egp ? Math.round((egp / maxVal) * 100) : 0
          const colors = [
            'var(--green)',
            'var(--blue)',
            'var(--brand)',
            'var(--purple)',
            'var(--amber)',
          ]
          const color = colors[i % colors.length]
          const label = formatSalary(
            candidate.salary_amount,
            candidate.salary_currency,
            candidate.salary_period,
          )

          return (
            <div key={candidate.id} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[11.5px] text-text w-44 flex-shrink-0 truncate font-medium">
                {candidate.name}
              </span>
              <div className="flex-1 h-5 bg-surface2 rounded-[6px] overflow-hidden relative border border-border">
                {egp ? (
                  <>
                    <div
                      className="h-full rounded-[5px] transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-semibold font-mono text-text2">
                      {label}
                    </span>
                  </>
                ) : (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-text3">
                    {label}
                  </span>
                )}
              </div>
              {egp && (
                <span className="text-[12px] font-mono text-text3 w-24 text-right flex-shrink-0">
                  ~{Math.round(egp / 1000)}K EGP
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
