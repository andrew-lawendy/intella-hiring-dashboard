import { useState } from 'react'
import { deriveActionItems, TYPE_COLORS } from '@/lib/actionQueue'
import type { StateMap } from '@/hooks/useCandidateState'
import { useAuth } from '@/hooks/useAuth'
import { useAllScores } from '@/hooks/useAllScores'
import { Badge } from '@/components/ui/badge'

interface CandidateSlot {
  id: string
  name: string
  slot: string | null
  job_id: number | null
}

interface ActionQueueProps {
  candidates: CandidateSlot[]
  stateMap: StateMap
}

export function ActionQueue({ candidates, stateMap }: ActionQueueProps) {
  const [open, setOpen] = useState(true)
  const { user } = useAuth()
  const { byCandidate } = useAllScores(user?.id)

  // My scores per candidate (for overdue-scorecard check)
  const myScoresMap = Object.fromEntries(
    Object.entries(byCandidate).map(([cid, byUser]) => [cid, byUser[user?.id ?? ''] ?? {}]),
  )

  const stateMin = Object.fromEntries(
    Object.entries(stateMap).map(([id, s]) => [
      id,
      { confirmed: s.confirmed, interview_status: s.interview_status, verdict: s.verdict },
    ]),
  )

  const items = deriveActionItems(
    candidates
      .filter((c) => c.job_id != null)
      .map((c) => ({ id: c.id, name: c.name, slot: c.slot, jobId: c.job_id as number })),
    stateMin,
    myScoresMap,
  )

  if (!items.length) return null

  return (
    <div className="mb-4 bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface2 transition-colors cursor-pointer"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 flex items-center gap-2">
          <Badge variant="secondary">{items.length}</Badge>
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
