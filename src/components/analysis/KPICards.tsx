import type { KPIs } from '@/lib/analytics'

interface KPICardsProps {
  kpis: KPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    { label: 'Total Candidates', value: kpis.totalCount, sub: 'in this round' },
    {
      label: 'AI Experience',
      value: kpis.aiExpCount,
      sub: `${Math.round((kpis.aiExpCount / Math.max(kpis.totalCount, 1)) * 100)}% of pool`,
    },
    {
      label: 'B2B Experience',
      value: kpis.b2bCount,
      sub: `${Math.round((kpis.b2bCount / Math.max(kpis.totalCount, 1)) * 100)}% of pool`,
    },
    { label: 'Avg Experience', value: `${kpis.avgTotalExp}y`, sub: 'total years' },
    { label: 'Shortlisted', value: kpis.shortlistedCount, sub: 'candidates' },
  ]

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-surface border border-border rounded-[var(--radius)] px-5 py-4 shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] transition-all"
        >
          <div
            className="text-[30px] font-medium tracking-[-0.03em] leading-none"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {c.value}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-text3 mt-1.5">
            {c.label}
          </div>
          <div className="text-[11px] text-text2 mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
