import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { type ColumnDef } from '@tanstack/react-table'
import { useCandidateMeta } from '@/hooks/useCandidateMeta'
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
import { formatInterviewSlot, interviewAtToDateInput } from '@/lib/interview'
import { formatSalary } from '@/lib/salary'

function currentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA')
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA')
  return { from, to }
}

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
  const { stateMap, setConfirmed, setInterviewStatus } = useCandidateState()
  const [flashId, setFlashId] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleStatusChange = useCallback(
    (id: string, val: string) => {
      setInterviewStatus(id, val as 'pending' | 'in-progress' | 'completed')
      setFlashId(id)
      setTimeout(() => setFlashId(null), 700)
    },
    [setInterviewStatus],
  )

  const defaults = currentMonthRange()
  const [from, setFrom] = useQueryState('from', parseAsString.withDefault(defaults.from))
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(defaults.to))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))

  const sortedMeta = useMemo(
    () =>
      [...allMeta]
        .sort((a, b) => {
          if (!a.interview_at) return 1
          if (!b.interview_at) return -1
          return a.interview_at.localeCompare(b.interview_at)
        })
        .filter((m) => {
          const date = interviewAtToDateInput(m.interview_at)
          if (!date) return false
          return date >= from && date <= to
        }),
    [allMeta, from, to],
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
          <span className="font-mono text-muted-foreground text-[12px]">{row.original.index}</span>
        ),
      },
      {
        id: 'candidate',
        header: 'Candidate',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-foreground">{row.original.candidate.name}</div>
            <div className="text-muted-foreground text-[12px] font-mono">
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
            {formatInterviewSlot(row.original.candidate.interview_at)}
          </span>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        size: 100,
        cell: ({ row }) => (
          <span
            className={`text-[12px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${row.original.candidate.type === 'Remote' ? 'bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-line)]' : 'bg-muted text-muted-foreground border-border'}`}
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
            {formatSalary(
              row.original.candidate.salary_amount,
              row.original.candidate.salary_currency,
              row.original.candidate.salary_period,
            )}
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
              className={`text-[12px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all whitespace-nowrap ${
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
              onValueChange={(val) => handleStatusChange(candidate.id, val)}
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
      {
        id: 'interview',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/interview/${row.original.candidate.id}`)}
            className="text-[12px] font-medium px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-surface text-text hover:bg-surface2 transition-colors cursor-pointer whitespace-nowrap"
          >
            Interview
          </button>
        ),
      },
    ],
    [setConfirmed, handleStatusChange, navigate],
  )

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Schedule</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        {allMeta.filter((m) => m.interview_at).length} interviews total
      </p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-text2 font-medium">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
            className="text-[12.5px] border border-border rounded-md px-2.5 py-1.5 bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-text2 font-medium">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
            className="text-[12.5px] border border-border rounded-md px-2.5 py-1.5 bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        pageSize={PAGE_SIZE}
        loading={loading}
        manualPagination
        page={page}
        total={sortedMeta.length}
        onPageChange={setPage}
        rowClassName={(row) =>
          row.candidate.id === flashId ? 'bg-green-50 dark:bg-green-950/20' : ''
        }
      />
    </div>
  )
}
