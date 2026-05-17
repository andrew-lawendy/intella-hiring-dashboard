import { useState, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { useCandidateMeta } from '@/hooks/useCandidateMeta'
import { useHiringRound, formatRoundDateRange, formatRoundYear } from '@/hooks/useHiringRound'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
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
  const { candidates: allMeta } = useCandidateMeta()
  const { data: round } = useHiringRound()
  const { stateMap, setConfirmed, setInterviewStatus } = useCandidateState()
  const [page, setPage] = useState(1)

  const sortedMeta = useMemo(
    () =>
      [...allMeta].sort((a, b) => {
        if (!a.slot || a.slot === 'TBD') return 1
        if (!b.slot || b.slot === 'TBD') return -1
        return a.slot.localeCompare(b.slot)
      }),
    [allMeta],
  )

  const pageIds = useMemo(
    () => sortedMeta.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => m.id),
    [sortedMeta, page],
  )

  const { data, loading } = useCandidates({ ids: pageIds })

  const rows = useMemo<ScheduleRow[]>(
    () =>
      pageIds.flatMap((id, i) => {
        const d = data.find((d) => d.candidate.id === id)
        const state = stateMap[id]
        if (!d || !state) return []
        return [{ index: (page - 1) * PAGE_SIZE + i + 1, candidate: d.candidate, state }]
      }),
    [pageIds, data, stateMap, page],
  )

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

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Schedule</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        {round
          ? `${formatRoundDateRange(round.start_date, round.end_date)}, ${formatRoundYear(round.start_date)}`
          : '—'}{' '}
        · {allMeta.length} interviews
      </p>

      <DataTable
        columns={columns}
        data={rows}
        pageSize={PAGE_SIZE}
        loading={loading}
        manualPagination
        page={page}
        total={sortedMeta.length}
        onPageChange={setPage}
      />
    </div>
  )
}
