import { useState } from 'react'
import { SCORE_CATEGORIES, isScoreSubmitted, sumScores, maxScore } from '@/lib/scoring'
import type { Scores } from '@/lib/scoring'

interface ScorecardProps {
  currentUser: 'peter' | 'ossama'
  peterScores: Scores
  ossamaScores: Scores
  onPeterChange: (scores: Scores) => void
  onOssamaChange: (scores: Scores) => void
}

function StarRating({
  category,
  value,
  onChange,
  readonly = false,
}: {
  category: string
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex items-center justify-between mb-1.5 text-[11.5px]">
      <span className="text-text2 w-28 flex-shrink-0">{category}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            aria-label={`star ${star} for ${category}`}
            onClick={() => !readonly && onChange?.(star)}
            disabled={readonly}
            className={[
              'text-sm leading-none transition-all duration-150',
              readonly ? 'cursor-default opacity-60' : 'cursor-pointer hover:scale-110',
              value >= star ? 'text-[#e4a82b]' : 'text-border-strong',
            ].join(' ')}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function Scorecard({
  currentUser,
  peterScores,
  ossamaScores,
  onPeterChange,
  onOssamaChange,
}: ScorecardProps) {
  const [revealed, setRevealed] = useState(false)

  const myScores = currentUser === 'peter' ? peterScores : ossamaScores
  const coScores = currentUser === 'peter' ? ossamaScores : peterScores
  const coName = currentUser === 'peter' ? 'Ossama' : 'Peter'
  const onMyChange = currentUser === 'peter' ? onPeterChange : onOssamaChange

  const mySubmitted = isScoreSubmitted(myScores)
  const coSubmitted = isScoreSubmitted(coScores)
  const canReveal = mySubmitted

  const pTotal = sumScores(peterScores)
  const oTotal = sumScores(ossamaScores)
  const combined = pTotal > 0 && oTotal > 0 ? Math.round((pTotal + oTotal) / 2) : pTotal || oTotal

  return (
    <div className="px-4 py-3.5 border-t border-border bg-surface">
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3">
          Scorecard
        </p>
        <span className="font-mono text-[13px] font-semibold text-brand bg-[var(--brand-soft)] px-2 py-0.5 rounded-[6px]">
          {combined}/{maxScore()}
        </span>
      </div>

      <p className="text-[10px] font-medium text-text3 mb-1.5 uppercase tracking-[0.06em]">
        {currentUser === 'peter' ? 'Peter' : 'Ossama'} (you)
      </p>
      {SCORE_CATEGORIES.map((cat) => (
        <StarRating
          key={cat}
          category={cat}
          value={myScores[cat]}
          onChange={(v) => onMyChange({ ...myScores, [cat]: v })}
        />
      ))}

      <div className="mt-3">
        <p className="text-[10px] font-medium text-text3 mb-1.5 uppercase tracking-[0.06em]">
          {coName}
        </p>
        {!canReveal ? (
          <p className="text-[11px] text-text3 italic">
            Submit your own scores first to see {coName}&apos;s ratings.
          </p>
        ) : !coSubmitted ? (
          <p className="text-[11px] text-text3 italic">{coName} hasn&apos;t scored yet.</p>
        ) : !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="text-[11px] font-medium text-brand bg-[var(--brand-soft)] border border-[color-mix(in_srgb,var(--brand)_25%,transparent)] px-3 py-1.5 rounded-[var(--radius-xs)] cursor-pointer hover:bg-brand hover:text-white transition-all"
          >
            Reveal {coName}&apos;s scores
          </button>
        ) : (
          SCORE_CATEGORIES.map((cat) => (
            <StarRating key={cat} category={cat} value={coScores[cat]} readonly />
          ))
        )}
      </div>
    </div>
  )
}
