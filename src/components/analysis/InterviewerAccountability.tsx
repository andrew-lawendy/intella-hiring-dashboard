import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

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
    <div className="overflow-x-auto rounded-[var(--radius)] border border-border shadow-[var(--shadow-sm)]">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {['Interviewer', 'Scorecards Submitted', 'Avg Submission Time'].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 bg-surface2 border-b border-border text-[10.5px] font-medium uppercase tracking-[0.06em] text-text3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.interviewer}
              className="border-b border-border last:border-b-0 hover:bg-surface2"
            >
              <td className="px-4 py-2.5 font-semibold text-text capitalize">{row.interviewer}</td>
              <td className="px-4 py-2.5 font-mono text-brand">{row.totalScorecards}</td>
              <td className="px-4 py-2.5 text-text3">
                {row.avgSubmitHours !== null ? `${row.avgSubmitHours.toFixed(1)}h` : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
