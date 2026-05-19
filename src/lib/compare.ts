import { maxScore } from './scoring'
import { formatInterviewSlot } from '@/lib/interview'
import { formatSalary } from '@/lib/salary'

interface CompareRow {
  label: string
  a: string
  b: string
}

export function buildCompareRows(
  candidateA: {
    name: string
    salary_amount: number | null
    salary_currency: string | null
    salary_period: string | null
    notice: string | null
    type: string | null
    interview_at: string | null
  },
  candidateB: {
    name: string
    salary_amount: number | null
    salary_currency: string | null
    salary_period: string | null
    notice: string | null
    type: string | null
    interview_at: string | null
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
  stateA: { verdict: string | null; combinedScore?: number },
  stateB: { verdict: string | null; combinedScore?: number },
): CompareRow[] {
  const max = maxScore()
  const scoreA = stateA.combinedScore ?? 0
  const scoreB = stateB.combinedScore ?? 0

  return [
    {
      label: 'Slot',
      a: formatInterviewSlot(candidateA.interview_at),
      b: formatInterviewSlot(candidateB.interview_at),
    },
    { label: 'Type', a: candidateA.type ?? '—', b: candidateB.type ?? '—' },
    {
      label: 'Salary',
      a: formatSalary(
        candidateA.salary_amount,
        candidateA.salary_currency,
        candidateA.salary_period,
      ),
      b: formatSalary(
        candidateB.salary_amount,
        candidateB.salary_currency,
        candidateB.salary_period,
      ),
    },
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
