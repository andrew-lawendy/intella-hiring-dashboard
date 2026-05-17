import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

type AuditLogRow = Database['public']['Tables']['audit_log']['Row']

interface AccountabilityRow {
  interviewer: string
  avgSubmitHours: number | null
  totalScorecards: number
}

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

  if (!rows.length)
    return <p className="text-text3 text-sm">No scorecard submissions recorded yet.</p>

  return (
    <div className="rounded-[var(--radius)] border border-border shadow-[var(--shadow-sm)]">
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="border-b border-border">
            {['Interviewer', 'Scorecards Submitted', 'Avg Submission Time'].map((h) => (
              <TableHead
                key={h}
                className="px-4 py-2.5 bg-surface2 text-[10.5px] font-medium tracking-[0.06em] text-text3"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.interviewer}
              className="border-b border-border last:border-b-0 hover:bg-surface2"
            >
              <TableCell className="px-4 py-2.5 font-semibold text-text capitalize">
                {row.interviewer}
              </TableCell>
              <TableCell className="px-4 py-2.5 font-mono text-brand">
                {row.totalScorecards}
              </TableCell>
              <TableCell className="px-4 py-2.5 text-text3">
                {row.avgSubmitHours !== null ? `${row.avgSubmitHours.toFixed(1)}h` : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
