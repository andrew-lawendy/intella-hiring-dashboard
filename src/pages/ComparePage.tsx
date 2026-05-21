import { useMemo } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useAllScores } from '@/hooks/useAllScores'
import { useAuth } from '@/hooks/useAuth'
import { useJobs } from '@/hooks/useJobs'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { formatInterviewSlot } from '@/lib/interview'
import { formatSalary } from '@/lib/salary'
import { maxScore, DEFAULT_SCORE_CATEGORIES } from '@/lib/scoring'
import { VERDICT_MAP } from '@/lib/verdicts'
import type { ScorerEntry } from '@/hooks/useAllScores'

function avgCategoryScore(entries: ScorerEntry[], cat: string): number {
  const vals = entries.map((e) => e.scores[cat] ?? 0).filter((v) => v > 0)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span>
      <span className="text-amber-400">{'★'.repeat(value)}</span>
      <span className="text-muted-foreground/30">{'★'.repeat(max - value)}</span>
    </span>
  )
}

export function ComparePage() {
  const [idA, setIdA] = useQueryState('a', parseAsString.withDefault(''))
  const [idB, setIdB] = useQueryState('b', parseAsString.withDefault(''))
  const [idC, setIdC] = useQueryState('c', parseAsString.withDefault(''))
  const [jobSlug] = useQueryState('job', parseAsString)

  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const { user } = useAuth()
  const { allScoresFor, combinedScoreFor } = useAllScores(user?.id)
  const { data: jobs = [] } = useJobs()
  const round = jobs.find((j) => j.slug === jobSlug) ?? null
  const scoreCategories: readonly string[] =
    (round?.score_categories as string[] | undefined) ?? DEFAULT_SCORE_CATEGORIES
  const checklistItems: string[] = (round?.checklist_items as string[] | undefined) ?? []

  const selectors = [
    { id: idA, setId: setIdA, placeholder: 'Candidate 1' },
    { id: idB, setId: setIdB, placeholder: 'Candidate 2' },
    { id: idC, setId: setIdC, placeholder: 'Candidate 3' },
  ]

  function clear() {
    setIdA('')
    setIdB('')
    setIdC('')
  }

  const max = maxScore(scoreCategories)

  const cards = useMemo(
    () =>
      [idA, idB, idC].filter(Boolean).flatMap((id) => {
        const d = data.find((d) => d.candidate.id === id)
        const state = stateMap[id]
        if (!d || !state) return []
        return [{ data: d, state, combined: combinedScoreFor(id), scorerEntries: allScoresFor(id) }]
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idA, idB, idC, data, stateMap],
  )

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const gridCols =
    cards.length <= 1
      ? 'grid-cols-1'
      : cards.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">
        Candidate Comparison
      </h1>
      <p className="text-text2 text-[13.5px] mb-6">
        Select up to 3 candidates to compare side by side
      </p>

      <div className="bg-surface border border-border rounded-[var(--radius)] p-4 mb-5 flex items-center gap-3 flex-wrap shadow-[var(--shadow-sm)]">
        <p className="text-sm text-text2 font-medium">Select candidates:</p>
        {selectors.map((sel, i) => (
          <select
            key={i}
            value={sel.id}
            onChange={(e) => sel.setId(e.target.value)}
            className="font-sans text-[11.5px] px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-border bg-surface text-text cursor-pointer min-w-[160px] outline-none focus:border-text"
          >
            <option value="">{sel.placeholder}</option>
            {data.map(({ candidate }) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        ))}
        <Button size="sm" variant="ghost" onClick={clear}>
          Clear
        </Button>
      </div>

      {cards.length < 2 ? (
        <div className="text-center py-16 text-text3">
          Select two or more candidates to compare.
        </div>
      ) : (
        <div className={`grid gap-4 ${gridCols}`}>
          {cards.map(({ data: d, state, combined, scorerEntries }) => {
            const { candidate, profile } = d
            const checklist = (state.checklist ?? {}) as Record<string, boolean>
            const verdict = state.verdict
              ? VERDICT_MAP[state.verdict as keyof typeof VERDICT_MAP]
              : null

            const infoRows: { label: string; value: React.ReactNode }[] = [
              { label: 'Slot', value: formatInterviewSlot(candidate.interview_at) },
              {
                label: 'Salary',
                value: formatSalary(
                  candidate.salary_amount,
                  candidate.salary_currency,
                  candidate.salary_period,
                ),
              },
              { label: 'Notice', value: candidate.notice ?? '—' },
              {
                label: 'Decision',
                value: verdict ? (
                  <span style={{ color: verdict.color }}>{verdict.label}</span>
                ) : (
                  '—'
                ),
              },
              { label: 'Confirmed', value: state.confirmed ? 'Yes' : 'No' },
            ]

            return (
              <div
                key={candidate.id}
                className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-surface2 to-surface border-b border-border">
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] text-text truncate">{candidate.name}</p>
                    {profile?.title && (
                      <p className="text-[12px] text-text2 mt-0.5 truncate">{profile.title}</p>
                    )}
                  </div>
                  <span className="text-[var(--purple)] font-semibold text-[13px] tabular-nums shrink-0 ml-3">
                    {combined}/{max}
                  </span>
                </div>

                {/* Info rows */}
                {infoRows.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-4 px-5 py-3 border-b border-border ${i % 2 === 1 ? 'bg-[color-mix(in_srgb,var(--surface2)_35%,var(--surface))]' : ''}`}
                  >
                    <span className="text-text3 font-medium text-[11px] uppercase tracking-[0.04em] w-20 shrink-0">
                      {label}
                    </span>
                    <span className="text-text text-[12.5px]">{value}</span>
                  </div>
                ))}

                {/* Score categories */}
                <div className="px-5 py-2 bg-surface2 border-b border-border">
                  <span className="text-text3 font-medium text-[11px] uppercase tracking-[0.04em]">
                    Scores
                  </span>
                </div>
                {scoreCategories.map((cat, i) => {
                  const val = avgCategoryScore(scorerEntries, cat)
                  return (
                    <div
                      key={cat}
                      className={`flex items-center gap-4 px-5 py-3 border-b border-border ${i % 2 === 1 ? 'bg-[color-mix(in_srgb,var(--surface2)_35%,var(--surface))]' : ''}`}
                    >
                      <span className="text-text3 font-medium text-[11px] uppercase tracking-[0.04em] w-20 shrink-0">
                        {cat}
                      </span>
                      {val > 0 ? <Stars value={val} /> : <span className="text-text3">—</span>}
                    </div>
                  )
                })}

                {/* Checklist */}
                {checklistItems.length > 0 && (
                  <>
                    <div className="px-5 py-2 bg-surface2 border-b border-border">
                      <span className="text-text3 font-medium text-[11px] uppercase tracking-[0.04em]">
                        Checklist
                      </span>
                    </div>
                    {checklistItems.map((item, i) => (
                      <div
                        key={item}
                        className={`flex items-center gap-4 px-5 py-3 ${i < checklistItems.length - 1 ? 'border-b border-border' : ''} ${i % 2 === 1 ? 'bg-[color-mix(in_srgb,var(--surface2)_35%,var(--surface))]' : ''}`}
                      >
                        <span className="text-text3 font-medium text-[11px] uppercase tracking-[0.04em] w-20 shrink-0">
                          {item}
                        </span>
                        <span
                          className={`text-[12.5px] ${checklist[item] ? 'text-[var(--green)]' : 'text-text2'}`}
                        >
                          {checklist[item] ? 'Yes' : 'No'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
