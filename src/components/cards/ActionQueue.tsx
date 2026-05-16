import { useState } from 'react'
import { deriveActionItems, type ActionItem } from '@/lib/actionQueue'
import type { StateMap } from '@/hooks/useCandidateState'
import type { Scores } from '@/lib/scoring'

interface CandidateSlot {
  id: string
  name: string
  slot: string | null
}

interface ActionQueueProps {
  candidates: CandidateSlot[]
  stateMap: StateMap
}

const TYPE_COLORS: Record<ActionItem['type'], string> = {
  unconfirmed: 'var(--amber)',
  'no-verdict': 'var(--blue)',
  'overdue-scorecard': 'var(--red)',
}

export function ActionQueue({ candidates, stateMap }: ActionQueueProps) {
  const [open, setOpen] = useState(true)

  const stateMin = Object.fromEntries(
    Object.entries(stateMap).map(([id, s]) => [
      id,
      {
        confirmed: s.confirmed,
        interview_status: s.interview_status,
        verdict: s.verdict,
        peter_scores: s.peter_scores as Scores,
        ossama_scores: s.ossama_scores as Scores,
      },
    ]),
  )

  const items = deriveActionItems(
    candidates.map((c) => ({ id: c.id, name: c.name, slot: c.slot })),
    stateMin,
  )

  if (!items.length) return null

  return (
    <div className="mb-4 bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface2 transition-colors cursor-pointer"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[var(--amber-bg)] border border-[var(--amber-line)] text-[var(--amber)] text-[9px] flex items-center justify-center font-bold">
            {items.length}
          </span>
          Needs Attention
        </span>
        <span className="text-text3 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-sans">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: TYPE_COLORS[item.type] }}
              />
              <span className="font-semibold text-text">{item.candidateName}</span>
              <span className="text-text3">—</span>
              <span className="text-text2">{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
