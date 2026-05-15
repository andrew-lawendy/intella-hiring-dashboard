import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import { totalScore, maxScore } from '@/lib/scoring'
import type { Scores } from '@/lib/scoring'

interface ShortlistComparisonProps {
  candidates: CandidateWithDetails[]
  stateMap: StateMap
  onClose: () => void
}

const VERDICT_LABELS: Record<string, string> = {
  'strong-yes': '⭐ Strong Yes',
  yes: '✓ Yes',
  maybe: '? Maybe',
  no: '✗ No',
}
const VERDICT_COLORS: Record<string, string> = {
  'strong-yes': 'var(--green)',
  yes: 'var(--blue)',
  maybe: 'var(--amber)',
  no: 'var(--red)',
}

export function ShortlistComparison({ candidates, stateMap, onClose }: ShortlistComparisonProps) {
  const shortlisted = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.shortlisted === true,
  )
  const max = maxScore()

  if (!shortlisted.length) {
    return (
      <div
        className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-5"
        onClick={onClose}
      >
        <div className="bg-bg rounded-[var(--radius)] p-8 text-center shadow-[var(--shadow-lg)]">
          <p className="text-text font-semibold mb-2">No candidates shortlisted yet.</p>
          <p className="text-text2 text-sm mb-4">Use the Shortlist button on candidate cards.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-text text-bg rounded-[var(--radius-xs)] text-sm cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[600] flex items-start justify-center py-5 px-5 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg rounded-[var(--radius)] w-full max-w-[900px] my-auto overflow-hidden shadow-[var(--shadow-lg)]">
        <div className="bg-accent px-5 py-4 flex justify-between items-center">
          <div>
            <p className="font-bold text-[16px] text-bg">Shortlist Comparison</p>
            <p className="text-bg/70 text-xs mt-0.5">{shortlisted.length} candidates</p>
          </div>
          <button
            onClick={onClose}
            className="text-bg/70 hover:text-bg text-xl bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface2">
                {['Candidate', 'Peter', 'Ossama', 'Combined', 'Verdict', 'Notes'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shortlisted.map(({ candidate, analysis }) => {
                const state = stateMap[candidate.id]
                if (!state) return null
                const ps = state.peter_scores as Scores
                const os = state.ossama_scores as Scores
                const pTotal = Object.values(ps).reduce((a, b) => a + b, 0)
                const oTotal = Object.values(os).reduce((a, b) => a + b, 0)
                const combined = totalScore(ps, os)

                return (
                  <tr
                    key={candidate.id}
                    className="border-t border-border hover:bg-surface2 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-[13px] text-text">{candidate.name}</p>
                      <p className="text-[10px] text-text2 mt-0.5">
                        {analysis?.current_role ?? ''}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[13px] text-[var(--purple)] text-center">
                      {pTotal || '—'}/{max}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[13px] text-[var(--blue)] text-center">
                      {oTotal || '—'}/{max}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[14px] text-[var(--green)] text-center">
                      {combined || '—'}/{max}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {state.verdict && (
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: VERDICT_COLORS[state.verdict] }}
                        >
                          {VERDICT_LABELS[state.verdict]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-text2 max-w-[180px]">
                      {state.peter_comment && <span>P: {state.peter_comment.slice(0, 50)}</span>}
                      {state.peter_comment && state.ossama_comment && <br />}
                      {state.ossama_comment && <span>O: {state.ossama_comment.slice(0, 50)}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
