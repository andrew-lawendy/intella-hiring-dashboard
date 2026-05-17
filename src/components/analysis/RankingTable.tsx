import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import type { RankingEntry } from '@/lib/analytics'
import { maxScore } from '@/lib/scoring'
import { VERDICT_MAP } from '@/lib/verdicts'
import { useInterviewerNames } from '@/hooks/useInterviewerNames'
import { DataTable } from '@/components/ui/data-table'

interface RankingTableProps {
  entries: RankingEntry[]
  nameMap: Record<string, string>
}

type RankingRow = RankingEntry & { rank: number; name: string }

export function RankingTable({ entries, nameMap }: RankingTableProps) {
  const max = maxScore()
  const getInterviewerName = useInterviewerNames()

  const rows = useMemo<RankingRow[]>(
    () =>
      [...entries]
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .map((e, i) => ({ ...e, rank: i + 1, name: nameMap[e.candidateId] ?? e.candidateId })),
    [entries, nameMap],
  )

  const columns = useMemo<ColumnDef<RankingRow>[]>(
    () => [
      {
        id: 'rank',
        header: '#',
        size: 52,
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-[11px]">{row.original.rank}</span>
        ),
      },
      {
        id: 'name',
        header: 'Candidate',
        accessorKey: 'name',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: 'combined',
        header: 'Combined',
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--green)]">
            {row.original.combinedScore || '—'}/{max}
          </span>
        ),
      },
      {
        id: 'scorer-a',
        header: getInterviewerName('peter'),
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-[var(--purple)]">
            {row.original.scoreA || '—'}/{max}
          </span>
        ),
      },
      {
        id: 'scorer-b',
        header: getInterviewerName('ossama'),
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-[var(--blue)]">
            {row.original.scoreB || '—'}/{max}
          </span>
        ),
      },
      {
        id: 'verdict',
        header: 'Verdict',
        size: 130,
        cell: ({ row }) =>
          row.original.verdict ? (
            <span
              className="text-[11px] font-semibold"
              style={{
                color:
                  VERDICT_MAP[row.original.verdict as keyof typeof VERDICT_MAP]?.color ??
                  'var(--text3)',
              }}
            >
              {VERDICT_MAP[row.original.verdict as keyof typeof VERDICT_MAP]?.short ??
                row.original.verdict}
            </span>
          ) : null,
      },
    ],
    [max, getInterviewerName],
  )

  return <DataTable columns={columns} data={rows} sortable pageSize={rows.length || 1} />
}
