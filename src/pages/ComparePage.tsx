import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { buildCompareRows } from '@/lib/compare'
import { Spinner } from '@/components/ui/spinner'

export function ComparePage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const [idA, setIdA] = useState<string>('')
  const [idB, setIdB] = useState<string>('')

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const dataA = data.find((d) => d.candidate.id === idA)
  const dataB = data.find((d) => d.candidate.id === idB)
  const stateA = idA ? stateMap[idA] : null
  const stateB = idB ? stateMap[idB] : null

  const rows =
    dataA && dataB && dataA.profile && dataB.profile && stateA && stateB
      ? buildCompareRows(
          dataA.candidate,
          dataB.candidate,
          dataA.profile,
          dataB.profile,
          stateA,
          stateB,
        )
      : []

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Compare</h1>
      <p className="text-text2 text-[13.5px] mb-6">Side-by-side candidate comparison</p>

      <div className="bg-surface border border-border rounded-[var(--radius)] p-4 mb-5 flex items-center gap-3 flex-wrap shadow-[var(--shadow-sm)]">
        <p className="text-[13px] text-text2 font-medium">Compare:</p>
        {(
          [
            { id: idA, setId: setIdA },
            { id: idB, setId: setIdB },
          ] as const
        ).map((sel, i) => (
          <select
            key={i}
            value={sel.id}
            onChange={(e) => sel.setId(e.target.value)}
            className="font-sans text-[11.5px] px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-border bg-surface text-text cursor-pointer min-w-[160px] outline-none focus:border-text"
          >
            <option value="">Select candidate…</option>
            {data.map(({ candidate }) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        ))}
      </div>

      {!rows.length ? (
        <div className="text-center py-16 text-text3">Select two candidates to compare.</div>
      ) : (
        <div className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="px-5 py-4 bg-surface2 font-medium text-[12px] text-text3 uppercase tracking-[0.04em]">
              Field
            </div>
            <div className="px-5 py-4 bg-gradient-to-b from-surface2 to-surface">
              <p className="font-semibold text-[14px] text-text">{dataA!.candidate.name}</p>
              <p className="text-[11px] text-text2 mt-0.5">{dataA!.profile?.title}</p>
            </div>
            <div className="px-5 py-4 bg-gradient-to-b from-surface2 to-surface">
              <p className="font-semibold text-[14px] text-text">{dataB!.candidate.name}</p>
              <p className="text-[11px] text-text2 mt-0.5">{dataB!.profile?.title}</p>
            </div>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 divide-x divide-border border-t border-border ${i % 2 === 1 ? 'bg-[color-mix(in_srgb,var(--surface2)_35%,var(--surface))]' : ''}`}
            >
              <div className="px-5 py-3 text-text2 font-medium text-[11px] uppercase tracking-[0.04em]">
                {row.label}
              </div>
              <div className="px-5 py-3 text-[12.5px] text-text">{row.a}</div>
              <div className="px-5 py-3 text-[12.5px] text-text">{row.b}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
