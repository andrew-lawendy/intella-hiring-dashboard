import { useState, useMemo } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20

export function SchedulePage() {
  const { data, loading } = useCandidates()
  const { stateMap, setConfirmed, setInterviewStatus } = useCandidateState()
  const [page, setPage] = useState(1)

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => {
        if (!a.candidate.slot || a.candidate.slot === 'TBD') return 1
        if (!b.candidate.slot || b.candidate.slot === 'TBD') return -1
        return a.candidate.slot.localeCompare(b.candidate.slot)
      }),
    [data],
  )

  const pageRows = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
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

      <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="border-b border-border">
              {['#', 'Candidate', 'Slot', 'Type', 'Salary', 'Notice', 'Confirmation', 'Status'].map(
                (h) => (
                  <TableHead
                    key={h}
                    className="px-4 py-3 bg-surface2 text-[10.5px] font-medium tracking-[0.08em] text-text3"
                  >
                    {h}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map(({ candidate }, i) => {
              const state = stateMap[candidate.id]
              if (!state) return null
              const globalIndex = (page - 1) * PAGE_SIZE + i + 1
              return (
                <TableRow
                  key={candidate.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-text3 font-mono text-[11px]">
                    {globalIndex}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="font-semibold text-text text-[13px]">{candidate.name}</div>
                    <div className="text-text3 text-[11px] font-mono">{candidate.email}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-[11.5px] text-text2 whitespace-nowrap">
                    {candidate.slot ?? 'TBD'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${candidate.type === 'Remote' ? 'bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-line)]' : 'bg-surface2 text-text2 border-border'}`}
                    >
                      {candidate.type}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[12px] text-text2 whitespace-nowrap">
                    {candidate.salary ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[12px] text-text2 whitespace-nowrap">
                    {candidate.notice ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Select
                      value={state.interview_status}
                      onValueChange={(val) =>
                        setInterviewStatus(
                          candidate.id,
                          val as 'pending' | 'in-progress' | 'completed',
                        )
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
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onChange={setPage} />
    </div>
  )
}
