// src/components/analysis/ExpandableRankingCard.tsx
import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { maxScore } from '@/lib/scoring'
import { VERDICT_MAP } from '@/lib/verdicts'
import type { RankingEntry } from '@/lib/analytics'

interface CardData extends RankingEntry {
  name: string
  fitScore: number | null
  strengths: string[]
  watchFor: string | null
}

interface ExpandableRankingCardProps {
  entries: CardData[]
}

export function ExpandableRankingCard({ entries }: ExpandableRankingCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const max = maxScore()

  const sorted = [...entries].sort((a, b) => b.combinedScore - a.combinedScore)

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry, i) => {
        const isOpen = expanded === entry.candidateId
        const verdictMeta = entry.verdict
          ? VERDICT_MAP[entry.verdict as keyof typeof VERDICT_MAP]
          : null

        return (
          <div
            key={entry.candidateId}
            className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]"
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : entry.candidateId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface2 transition-colors"
            >
              <span className="text-[13px] font-mono text-text3 w-6 flex-shrink-0">#{i + 1}</span>
              <span className="flex-1 font-semibold text-[14px] text-text">{entry.name}</span>
              {entry.fitScore != null && (
                <span className="text-[13px] font-mono font-bold text-[var(--green)]">
                  {entry.fitScore}%
                </span>
              )}
              {entry.combinedScore > 0 && (
                <span className="text-[12px] font-mono text-text2">
                  {entry.combinedScore}/{max}
                </span>
              )}
              {verdictMeta && (
                <span
                  className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: verdictMeta.color,
                    background: `color-mix(in srgb, ${verdictMeta.color} 12%, transparent)`,
                  }}
                >
                  {verdictMeta.short}
                </span>
              )}
              <ChevronDownIcon
                className={cn(
                  'size-4 text-text3 transition-transform flex-shrink-0',
                  isOpen && 'rotate-180',
                )}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-3">
                {entry.strengths.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text3 mb-1.5">
                      Strengths
                    </p>
                    <ul className="flex flex-col gap-1">
                      {entry.strengths.map((s) => (
                        <li key={s} className="text-[12.5px] text-[var(--green)] flex gap-1.5">
                          <span>✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.watchFor && (
                  <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-line)] rounded-[var(--radius-xs)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--amber)] mb-1">
                      Watch For
                    </p>
                    <p className="text-[12.5px] text-text2">{entry.watchFor}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
