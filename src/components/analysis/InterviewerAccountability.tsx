import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { useAuth } from '@/hooks/useAuth'
import { useAllScores } from '@/hooks/useAllScores'
import { useTeamProfiles, displayName } from '@/hooks/useTeamProfiles'
import { DataTable } from '@/components/ui/data-table'

interface AccountabilityRow {
  userId: string
  name: string
  totalScorecards: number
}

const columns: ColumnDef<AccountabilityRow>[] = [
  {
    id: 'interviewer',
    header: 'Interviewer',
    cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
  },
  {
    id: 'scorecards',
    header: 'Candidates Scored',
    size: 180,
    cell: ({ row }) => (
      <span className="font-mono text-primary">{row.original.totalScorecards}</span>
    ),
  },
]

export function InterviewerAccountability() {
  const { user } = useAuth()
  const { byCandidate } = useAllScores(user?.id)
  const teamProfiles = useTeamProfiles()

  const rows = useMemo<AccountabilityRow[]>(() => {
    // Count distinct candidates scored per user
    const byUser: Record<string, Set<string>> = {}
    for (const [candidateId, userScores] of Object.entries(byCandidate)) {
      for (const uid of Object.keys(userScores)) {
        if (!byUser[uid]) byUser[uid] = new Set()
        byUser[uid].add(candidateId)
      }
    }
    return Object.entries(byUser)
      .map(([uid, candidates]) => ({
        userId: uid,
        name: displayName(teamProfiles[uid], uid.slice(0, 8)),
        totalScorecards: candidates.size,
      }))
      .sort((a, b) => b.totalScorecards - a.totalScorecards)
  }, [byCandidate, teamProfiles])

  if (!rows.length) return <p className="text-text3 text-sm">No scores submitted yet.</p>

  return <DataTable columns={columns} data={rows} pageSize={rows.length || 1} />
}
