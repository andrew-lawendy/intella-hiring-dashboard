import { useEffect, useState, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { DataTable } from '@/components/ui/data-table'

type AuditLogRow = Database['public']['Tables']['audit_log']['Row']

interface AccountabilityRow {
  interviewer: string
  avgSubmitHours: number | null
  totalScorecards: number
}

const columns: ColumnDef<AccountabilityRow>[] = [
  {
    id: 'interviewer',
    header: 'Interviewer',
    cell: ({ row }) => (
      <span className="font-semibold capitalize text-foreground">{row.original.interviewer}</span>
    ),
  },
  {
    id: 'scorecards',
    header: 'Scorecards Submitted',
    size: 180,
    cell: ({ row }) => (
      <span className="font-mono text-primary">{row.original.totalScorecards}</span>
    ),
  },
  {
    id: 'avgTime',
    header: 'Avg Submission Time',
    size: 180,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.avgSubmitHours !== null
          ? `${row.original.avgSubmitHours.toFixed(1)}h`
          : 'N/A'}
      </span>
    ),
  },
]

export function InterviewerAccountability() {
  const [rows, setRows] = useState<AccountabilityRow[]>([])

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*')
      .in('field', ['peter_scores', 'ossama_scores'])
      .then(({ data }) => {
        if (!data) return
        const entries = data as AuditLogRow[]
        const byUser: Record<string, number[]> = {}
        for (const entry of entries) {
          const user = entry.changed_by.split('@')[0]
          if (!byUser[user]) byUser[user] = []
          byUser[user].push(new Date(entry.created_at).getTime())
        }
        setRows(
          Object.entries(byUser).map(([interviewer, timestamps]) => ({
            interviewer,
            avgSubmitHours: null,
            totalScorecards: timestamps.length,
          })),
        )
      })
  }, [])

  const stableRows = useMemo(() => rows, [rows])

  if (!rows.length)
    return <p className="text-text3 text-sm">No scorecard submissions recorded yet.</p>

  return <DataTable columns={columns} data={stableRows} pageSize={stableRows.length || 1} />
}
