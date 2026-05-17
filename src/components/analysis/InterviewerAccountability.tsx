import { useEffect, useState, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { useInterviewerNames } from '@/hooks/useInterviewerNames'
import { DataTable } from '@/components/ui/data-table'

type AuditLogRow = Database['public']['Tables']['audit_log']['Row']

interface AccountabilityRow {
  email: string
  displayName: string
  totalScorecards: number
}

export function InterviewerAccountability() {
  const [rows, setRows] = useState<AccountabilityRow[]>([])
  const getInterviewerName = useInterviewerNames()

  useEffect(() => {
    // Filter audit log entries where the field is a scorecard column (ends with _scores)
    supabase
      .from('audit_log')
      .select('*')
      .like('field', '%_scores')
      .then(({ data }) => {
        if (!data) return
        const entries = data as AuditLogRow[]
        const byEmail: Record<string, number> = {}
        for (const entry of entries) {
          const email = entry.changed_by
          byEmail[email] = (byEmail[email] ?? 0) + 1
        }
        setRows(
          Object.entries(byEmail).map(([email, count]) => ({
            email,
            displayName: email,
            totalScorecards: count,
          })),
        )
      })
  }, [])

  // Resolve display names — map email prefix to profile name if available
  const resolvedRows = useMemo(
    () =>
      rows.map((r) => {
        const slot = r.email.split('@')[0]
        const name = getInterviewerName(slot)
        return { ...r, displayName: name !== 'Interviewer' ? name : r.email.split('@')[0] }
      }),
    [rows, getInterviewerName],
  )

  const columns = useMemo<ColumnDef<(typeof resolvedRows)[number]>[]>(
    () => [
      {
        id: 'interviewer',
        header: 'Interviewer',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.displayName}</span>
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
    ],
    [],
  )

  if (!resolvedRows.length)
    return <p className="text-text3 text-sm">No scorecard submissions recorded yet.</p>

  return <DataTable columns={columns} data={resolvedRows} pageSize={resolvedRows.length || 1} />
}
