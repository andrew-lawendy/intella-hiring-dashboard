import { totalScore } from './scoring'
import type { Scores } from './scoring'

interface AnalysisRow {
  candidate_id: string
  ai_exp: boolean
  b2b: boolean
  b2c: boolean
  fintech: boolean
  total_exp: number | null
  pm_exp: number | null
  domains: string[] | null
}

interface StateRow {
  candidate_id: string
  peter_scores: unknown
  ossama_scores: unknown
  shortlisted: boolean | null
  verdict: string | null
  interview_status: string
}

export interface KPIs {
  totalCount: number
  aiExpCount: number
  b2bCount: number
  avgTotalExp: number
  shortlistedCount: number
}

export function computeKPIs(analysis: AnalysisRow[], states: StateRow[]): KPIs {
  const totalCount = analysis.length
  const aiExpCount = analysis.filter((a) => a.ai_exp).length
  const b2bCount = analysis.filter((a) => a.b2b).length
  const avgTotalExp =
    totalCount > 0
      ? Math.round(analysis.reduce((sum, a) => sum + (a.total_exp ?? 0), 0) / totalCount)
      : 0
  const shortlistedCount = states.filter((s) => s.shortlisted === true).length
  return { totalCount, aiExpCount, b2bCount, avgTotalExp, shortlistedCount }
}

export function computeDomainFrequency(analysis: AnalysisRow[]): Record<string, number> {
  const freq: Record<string, number> = {}
  for (const a of analysis) {
    for (const domain of a.domains ?? []) {
      freq[domain] = (freq[domain] ?? 0) + 1
    }
  }
  return freq
}

export interface RankingEntry {
  candidateId: string
  combinedScore: number
  verdict: string | null
  scoreA: number
  scoreB: number
}

export function computeRanking(
  analysis: { candidate_id: string }[],
  stateMap: Record<string, StateRow>,
  _profileMap: Record<string, { fit_score?: number | null }>,
): RankingEntry[] {
  return analysis
    .map((a) => {
      const s = stateMap[a.candidate_id]
      if (!s) return null
      const slotA = s.peter_scores as Scores
      const slotB = s.ossama_scores as Scores
      return {
        candidateId: a.candidate_id,
        combinedScore: totalScore(slotA, slotB),
        verdict: s.verdict,
        scoreA: Object.values(slotA).reduce((x, y) => x + y, 0),
        scoreB: Object.values(slotB).reduce((x, y) => x + y, 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.combinedScore - a!.combinedScore) as RankingEntry[]
}
