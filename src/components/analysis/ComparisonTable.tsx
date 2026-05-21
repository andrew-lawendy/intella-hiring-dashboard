// src/components/analysis/ComparisonTable.tsx
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ComparisonRow } from '@/lib/analytics'
import { DataTable } from '@/components/ui/data-table'
import { formatSalary } from '@/lib/salary'
import { VERDICT_MAP } from '@/lib/verdicts'

interface ComparisonTableProps {
  rows: ComparisonRow[]
  onNameClick?: (id: string) => void
}

export function ComparisonTable({ rows, onNameClick }: ComparisonTableProps) {
  const columns = useMemo<ColumnDef<ComparisonRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        size: 160,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onNameClick?.(row.original.id)}
            className="font-semibold text-left text-foreground hover:text-primary transition-colors"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        id: 'fit',
        header: 'Fit',
        size: 60,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--green)]">
            {row.original.fitScore != null ? `${row.original.fitScore}%` : '—'}
          </span>
        ),
      },
      {
        id: 'pm',
        header: 'PM Exp',
        size: 72,
        cell: ({ row }) => (
          <span className="font-mono text-[12px]">
            {row.original.pmExp != null ? `${row.original.pmExp}y` : '—'}
          </span>
        ),
      },
      {
        id: 'total',
        header: 'Total Exp',
        size: 80,
        cell: ({ row }) => (
          <span className="font-mono text-[12px]">
            {row.original.totalExp != null ? `${row.original.totalExp}y` : '—'}
          </span>
        ),
      },
      {
        id: 'ai',
        header: 'AI',
        size: 44,
        cell: ({ row }) => <span>{row.original.aiExp ? '✓' : '—'}</span>,
      },
      {
        id: 'fin',
        header: 'Fin',
        size: 44,
        cell: ({ row }) => <span>{row.original.fintech ? '✓' : '—'}</span>,
      },
      {
        id: 'b2b',
        header: 'B2B',
        size: 44,
        cell: ({ row }) => <span>{row.original.b2b ? '✓' : '—'}</span>,
      },
      {
        id: 'uni',
        header: 'University',
        size: 140,
        cell: ({ row }) => (
          <span className="text-[12px] text-muted-foreground">
            {row.original.university ?? '—'}
          </span>
        ),
      },
      {
        id: 'salary',
        header: 'Salary',
        size: 140,
        cell: ({ row }) => (
          <span className="text-[12px] font-mono">
            {formatSalary(
              row.original.salaryAmount,
              row.original.salaryCurrency,
              row.original.salaryPeriod,
            )}
          </span>
        ),
      },
      {
        id: 'notice',
        header: 'Notice',
        size: 90,
        cell: ({ row }) => (
          <span className="text-[12px] text-muted-foreground">{row.original.notice ?? '—'}</span>
        ),
      },
      {
        id: 'verdict',
        header: 'Verdict',
        size: 100,
        cell: ({ row }) => {
          const v = row.original.verdict
          const meta = v ? VERDICT_MAP[v as keyof typeof VERDICT_MAP] : null
          return meta ? (
            <span className="text-[12px] font-semibold" style={{ color: meta.color }}>
              {meta.short}
            </span>
          ) : null
        },
      },
    ],
    [onNameClick],
  )

  return <DataTable columns={columns} data={rows} sortable pageSize={rows.length || 1} />
}
