import { useAuth } from '@/hooks/useAuth'
import { useAllScores } from '@/hooks/useAllScores'
import { DEFAULT_SCORE_CATEGORIES, maxScore } from '@/lib/scoring'
import { cn } from '@/lib/utils'

interface ScorecardProps {
  candidateId: string
  scoreCategories?: readonly string[]
  activeSubTab: 'scores' | 'summary'
}

function Stars({
  value,
  max = 5,
  onChange,
}: {
  value: number
  max?: number
  onChange?: (v: number) => void
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            'text-[13px] leading-none transition-all',
            onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default',
            value >= star ? 'text-[#e4a82b]' : 'text-border',
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function Scorecard({
  candidateId,
  scoreCategories = DEFAULT_SCORE_CATEGORIES,
  activeSubTab,
}: ScorecardProps) {
  const { user } = useAuth()
  const { allScoresFor, combinedScoreFor, setMyScore } = useAllScores(user?.id)

  const scorers = allScoresFor(candidateId)
  const combined = combinedScoreFor(candidateId)
  const max = maxScore(scoreCategories)

  // Ensure current user always has a column even if they haven't scored yet
  const meEntry = scorers.find((s) => s.isMe)
  const others = scorers.filter((s) => !s.isMe)
  const allColumns = meEntry
    ? [meEntry, ...others]
    : [{ userId: user?.id ?? '', name: 'You', scores: {}, total: 0, isMe: true }, ...others]

  if (activeSubTab === 'summary') {
    return (
      <div className="p-5">
        {/* Combined score */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[32px] font-bold text-foreground tabular-nums">{combined}</span>
          <span className="text-[18px] text-muted-foreground">/ {max}</span>
          <span className="text-[var(--amber)] text-[20px] ml-1">★</span>
        </div>

        {/* Per-category averages */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
            Category averages
          </p>
          {scoreCategories.map((cat) => {
            const vals = allColumns.map((s) => (s.scores[cat] ?? 0) as number).filter((v) => v > 0)
            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
            return (
              <div key={cat} className="flex items-center gap-3 mb-2 text-[12px]">
                <span className="w-28 flex-shrink-0 text-muted-foreground">{cat}</span>
                <Stars value={avg} />
                <span className="text-[11px] text-muted-foreground tabular-nums">{avg}/5</span>
              </div>
            )
          })}
        </div>

        {/* Per-user totals */}
        {allColumns.some((s) => s.total > 0) && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
              By reviewer
            </p>
            {allColumns.map((scorer) => (
              <div
                key={scorer.userId}
                className="flex items-center justify-between mb-2 text-[12.5px]"
              >
                <span className="text-foreground font-medium">
                  {scorer.name}
                  {scorer.isMe ? ' (you)' : ''}
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {scorer.total || '—'}/{max}
                </span>
              </div>
            ))}
          </div>
        )}

        {allColumns.every((s) => s.total === 0) && (
          <p className="text-[13px] text-muted-foreground italic">No scores submitted yet.</p>
        )}
      </div>
    )
  }

  // Scores tab — comparison table
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-32">
              Category
            </th>
            {allColumns.map((scorer) => (
              <th
                key={scorer.userId}
                className={cn(
                  'text-center px-3 py-2.5 font-semibold min-w-[100px]',
                  scorer.isMe ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {scorer.name}
                {scorer.isMe && (
                  <span className="block text-[11px] font-normal text-muted-foreground">you</span>
                )}
              </th>
            ))}
            {allColumns.length > 1 && (
              <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground min-w-[80px]">
                Avg
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {scoreCategories.map((cat) => {
            const vals = allColumns.map((s) => (s.scores[cat] ?? 0) as number).filter((v) => v > 0)
            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
            return (
              <tr
                key={cat}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted-foreground">{cat}</td>
                {allColumns.map((scorer) => {
                  const val = (scorer.scores[cat] ?? 0) as number
                  return (
                    <td key={scorer.userId} className="px-3 py-2 text-center">
                      {scorer.isMe ? (
                        <Stars value={val} onChange={(v) => setMyScore(candidateId, cat, v)} />
                      ) : val > 0 ? (
                        <Stars value={val} />
                      ) : (
                        <span className="text-border">—</span>
                      )}
                    </td>
                  )
                })}
                {allColumns.length > 1 && (
                  <td className="px-3 py-2 text-center text-muted-foreground tabular-nums">
                    {avg > 0 ? avg : '—'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/30">
            <td className="px-4 py-2.5 font-semibold text-foreground text-[12px]">Total</td>
            {allColumns.map((scorer) => (
              <td
                key={scorer.userId}
                className="px-3 py-2.5 text-center font-mono font-semibold text-foreground"
              >
                {scorer.total > 0 ? `${scorer.total}/${max}` : '—'}
              </td>
            ))}
            {allColumns.length > 1 && (
              <td className="px-3 py-2.5 text-center font-mono font-bold text-primary">
                {combined > 0 ? `${combined}/${max}` : '—'}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
