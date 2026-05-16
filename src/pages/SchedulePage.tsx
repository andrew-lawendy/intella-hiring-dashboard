import { useState, useMemo } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { Pagination } from '@/components/ui/Pagination'

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
        <div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Schedule</h1>
      <p className="text-text2 text-[13.5px] mb-6">May 17–21, 2026 · {data.length} interviews</p>

      <div className="overflow-x-auto bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {['#', 'Candidate', 'Slot', 'Type', 'Salary', 'Notice', 'Confirmation', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 bg-surface2 border-b border-border text-[10.5px] font-medium uppercase tracking-[0.08em] text-text3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map(({ candidate }, i) => {
              const state = stateMap[candidate.id]
              if (!state) return null
              const globalIndex = (page - 1) * PAGE_SIZE + i + 1
              return (
                <tr
                  key={candidate.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors"
                >
                  <td className="px-4 py-3 text-text3 font-mono text-[11px]">{globalIndex}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text text-[13px]">{candidate.name}</div>
                    <div className="text-text3 text-[11px] font-mono">{candidate.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text2 whitespace-nowrap">
                    {candidate.slot ?? 'TBD'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${candidate.type === 'Remote' ? 'bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue-line)]' : 'bg-surface2 text-text2 border-border'}`}
                    >
                      {candidate.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text2 whitespace-nowrap">
                    {candidate.salary ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text2 whitespace-nowrap">
                    {candidate.notice ?? '—'}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={state.interview_status}
                      onChange={(e) =>
                        setInterviewStatus(
                          candidate.id,
                          e.target.value as 'pending' | 'in-progress' | 'completed',
                        )
                      }
                      className="text-[11.5px] font-sans px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-surface text-text cursor-pointer min-w-[120px] outline-none focus:border-text"
                    >
                      <option value="pending">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Done</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onChange={setPage} />
    </div>
  )
}
