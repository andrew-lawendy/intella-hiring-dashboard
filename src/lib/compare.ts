import { totalScore, maxScore } from './scoring'
import type { Scores } from './scoring'

interface CompareRow {
  label: string
  a: string
  b: string
}

export function buildCompareRows(
  candidateA: {
    name: string
    salary: string | null
    notice: string | null
    type: string | null
    slot: string | null
  },
  candidateB: {
    name: string
    salary: string | null
    notice: string | null
    type: string | null
    slot: string | null
  },
  profileA: {
    fit_score: number | null
    fit_label: string | null
    ai_score: number | null
    b2b_score: number | null
    fintech_score: number | null
    seniority_score: number | null
  },
  profileB: {
    fit_score: number | null
    fit_label: string | null
    ai_score: number | null
    b2b_score: number | null
    fintech_score: number | null
    seniority_score: number | null
  },
  stateA: { peter_scores: unknown; ossama_scores: unknown; verdict: string | null },
  stateB: { peter_scores: unknown; ossama_scores: unknown; verdict: string | null },
): CompareRow[] {
  const max = maxScore()
  const scoreA = totalScore(stateA.peter_scores as Scores, stateA.ossama_scores as Scores)
  const scoreB = totalScore(stateB.peter_scores as Scores, stateB.ossama_scores as Scores)

  return [
    { label: 'Slot', a: candidateA.slot ?? '—', b: candidateB.slot ?? '—' },
    { label: 'Type', a: candidateA.type ?? '—', b: candidateB.type ?? '—' },
    { label: 'Salary', a: candidateA.salary ?? '—', b: candidateB.salary ?? '—' },
    { label: 'Notice', a: candidateA.notice ?? '—', b: candidateB.notice ?? '—' },
    {
      label: 'Fit Score',
      a: `${profileA.fit_score ?? 0}% — ${profileA.fit_label ?? '—'}`,
      b: `${profileB.fit_score ?? 0}% — ${profileB.fit_label ?? '—'}`,
    },
    { label: 'AI Score', a: `${profileA.ai_score ?? 0}/5`, b: `${profileB.ai_score ?? 0}/5` },
    { label: 'B2B Score', a: `${profileA.b2b_score ?? 0}/5`, b: `${profileB.b2b_score ?? 0}/5` },
    {
      label: 'Fintech Score',
      a: `${profileA.fintech_score ?? 0}/5`,
      b: `${profileB.fintech_score ?? 0}/5`,
    },
    {
      label: 'Seniority',
      a: `${profileA.seniority_score ?? 0}/5`,
      b: `${profileB.seniority_score ?? 0}/5`,
    },
    { label: 'Combined Score', a: `${scoreA}/${max}`, b: `${scoreB}/${max}` },
    { label: 'Verdict', a: stateA.verdict ?? '—', b: stateB.verdict ?? '—' },
  ]
}
