import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

type ScheduleRow = {
  index: number
  candidate: Candidate
  state: State
}

const PAGE_SIZE = 20

export function SchedulePage() {
  const { data, loading } = useCandidates()
  const { stateMap, setConfirmed, setInterviewStatus } = useCandidateState()

  const rows = useMemo<ScheduleRow[]>(() => {
    const sorted = [...data].sort((a, b) => {
      if (!a.candidate.slot || a.candidate.slot === 'TBD') return 1
      if (!b.candidate.slot || b.candidate.slot === 'TBD') return -1
      return a.candidate.slot.localeCompare(b.candidate.slot)
    })
    return sorted
      .map((d, i) => ({
        index: i + 1,
        candidate: d.candidate,
        state: stateMap[d.candidate.id],
      }))
      .filter((r) => !!r.state)
  }, [data, stateMap])

  const columns = useMemo<ColumnDef<ScheduleRow>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        size: 52,
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-[11px]">{row.original.index}</span>
        ),
      },
      {
        id: 'candidate',
        header: 'Candidate',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-foreground">{row.original.candidate.name}</div>
            <div className="text-muted-foreground text-[11px] font-mono">
              {row.original.candidate.email}
            </div>
          </div>
        ),
      },
      {
        id: 'slot',
        header: 'Slot',
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] text-muted-foreground whitespace-nowrap">
            {row.original.candidate.slot ?? 'TBD'}
          </span>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        size: 100,
        cell: ({ row }) => (
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${row.original.candidate.type === 'Remote' ? 'bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-line)]' : 'bg-muted text-muted-foreground border-border'}`}
          >
            {row.original.candidate.type}
          </span>
        ),
      },
      {
        id: 'salary',
        header: 'Salary',
        size: 140,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.candidate.salary ?? '—'}
          </span>
        ),
      },
      {
        id: 'notice',
        header: 'Notice',
        size: 120,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.candidate.notice ?? '—'}
          </span>
        ),
      },
      {
        id: 'confirmation',
        header: 'Confirmation',
        size: 130,
        cell: ({ row }) => {
          const { candidate, state } = row.original
          return (
            <button
              onClick={() => setConfirmed(candidate.id, !state.confirmed)}
              className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all whitespace-nowrap ${
                state.confirmed
                  ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green-line)] hover:bg-[var(--red-bg)] hover:text-[var(--red)] hover:border-[var(--red-line)]'
                  : 'bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber-line)] hover:bg-[var(--amber)] hover:text-white hover:border-[var(--amber)]'
              }`}
            >
              {state.confirmed ? 'Confirmed' : 'Pending'}
            </button>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        size: 148,
        cell: ({ row }) => {
          const { candidate, state } = row.original
          return (
            <Select
              value={state.interview_status}
              onValueChange={(val) =>
                setInterviewStatus(candidate.id, val as 'pending' | 'in-progress' | 'completed')
              }
            >
              <SelectTrigger size="sm" className="min-w-[120px] text-[11.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Done</SelectItem>
              </SelectContent>
            </Select>
          )
        },
      },
    ],
    [setConfirmed, setInterviewStatus],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Schedule</h1>
      <p className="text-text2 text-[13.5px] mb-6">May 17–21, 2026 · {data.length} interviews</p>

      <DataTable columns={columns} data={rows} pageSize={PAGE_SIZE} />
    </div>
  )
}
