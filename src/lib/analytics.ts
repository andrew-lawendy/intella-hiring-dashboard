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
  combinedScoreMap: Record<string, number> = {},
): RankingEntry[] {
  return analysis
    .map((a) => {
      const s = stateMap[a.candidate_id]
      if (!s) return null
      const combined = combinedScoreMap[a.candidate_id] ?? 0
      return {
        candidateId: a.candidate_id,
        combinedScore: combined,
        verdict: s.verdict,
        scoreA: combined,
        scoreB: 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.combinedScore - a!.combinedScore) as RankingEntry[]
}

// ── Types used by new sections ──────────────────────────────────────────────

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export interface HeatmapData {
  candidateNames: string[]
  domains: string[]
  /** grid[candidateIndex][domainIndex] = true if covered */
  grid: boolean[][]
}

export interface ComparisonRow {
  id: string
  name: string
  fitScore: number | null
  pmExp: number | null
  totalExp: number | null
  aiExp: boolean
  fintech: boolean
  b2b: boolean
  b2c: boolean
  university: string | null
  gradYear: number | null
  masters: boolean
  salaryAmount: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  notice: string | null
  seniority: string | null
  verdict: string | null
}

export interface Highlight {
  title: string
  value: string
  sub?: string
}

// ── PM Experience bars ───────────────────────────────────────────────────────

export function computePmExpBars(
  data: { candidate: { name: string }; analysis: { pm_exp: number | null } | null }[],
): { label: string; value: number; color: string }[] {
  return data
    .map((d) => ({
      label: d.candidate.name.split(' ')[0],
      value: d.analysis?.pm_exp ?? 0,
      color:
        (d.analysis?.pm_exp ?? 0) >= 8
          ? 'var(--purple)'
          : (d.analysis?.pm_exp ?? 0) >= 5
            ? 'var(--blue)'
            : (d.analysis?.pm_exp ?? 0) >= 3
              ? 'var(--amber)'
              : 'var(--text3)',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)
}

// ── Salary comparison bars ───────────────────────────────────────────────────

export function computeSalaryBars(
  data: {
    candidate: {
      name: string
      salary_amount: number | null
      salary_currency: string | null
      salary_period: string | null
    }
  }[],
  salaryToEGP: (a: number | null, c: string | null, p: string | null) => number | null,
): { label: string; value: number; color: string }[] {
  const items = data
    .map((d) => ({
      label: d.candidate.name.split(' ')[0],
      value:
        salaryToEGP(
          d.candidate.salary_amount,
          d.candidate.salary_currency,
          d.candidate.salary_period,
        ) ?? 0,
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)

  const max = items[0]?.value ?? 1
  return items.map((x) => ({
    ...x,
    color:
      x.value >= max * 0.8 ? 'var(--red)' : x.value >= max * 0.5 ? 'var(--blue)' : 'var(--green)',
  }))
}

// ── Education data ───────────────────────────────────────────────────────────

export function computeEducationData(
  data: {
    candidate: { name: string }
    analysis: { degree: string | null; grad_year: number | null } | null
  }[],
): { degreeSlices: DonutSlice[]; gradYearBars: { label: string; value: number; color: string }[] } {
  const DEGREE_COLORS: Record<string, string> = {
    BSc: 'var(--blue)',
    BEng: 'var(--purple)',
    BA: 'var(--amber)',
    Masters: 'var(--green)',
    Other: 'var(--text3)',
  }

  const degreeCounts: Record<string, number> = {}
  for (const d of data) {
    const deg = d.analysis?.degree ?? ''
    const key =
      deg.toLowerCase().includes('master') || deg.toLowerCase().includes('msc')
        ? 'Masters'
        : deg.toLowerCase().includes('bsc') || deg.toLowerCase().includes('b.sc')
          ? 'BSc'
          : deg.toLowerCase().includes('beng') || deg.toLowerCase().includes('b.eng')
            ? 'BEng'
            : deg.toLowerCase().includes('ba') || deg.toLowerCase().includes('b.a')
              ? 'BA'
              : deg
                ? 'Other'
                : 'Unknown'
    degreeCounts[key] = (degreeCounts[key] ?? 0) + 1
  }

  const degreeSlices: DonutSlice[] = Object.entries(degreeCounts)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value, color: DEGREE_COLORS[label] ?? 'var(--text3)' }))

  const gradYearBars = data
    .filter((d) => d.analysis?.grad_year != null)
    .map((d) => ({
      label: d.candidate.name.split(' ')[0],
      value: d.analysis!.grad_year!,
      color:
        d.analysis!.grad_year! >= 2020
          ? 'var(--blue)'
          : d.analysis!.grad_year! >= 2016
            ? 'var(--amber)'
            : 'var(--text3)',
    }))
    .sort((a, b) => b.value - a.value)

  return { degreeSlices, gradYearBars }
}

// ── Domain coverage donuts ───────────────────────────────────────────────────

export function computeDomainCoverage(
  analysis: { ai_exp: boolean; b2b: boolean; b2c: boolean; fintech: boolean }[],
): { ai: DonutSlice[]; fintech: DonutSlice[]; b2bB2c: DonutSlice[] } {
  const total = analysis.length || 1
  const aiYes = analysis.filter((a) => a.ai_exp).length
  const finYes = analysis.filter((a) => a.fintech).length
  const b2bOnly = analysis.filter((a) => a.b2b && !a.b2c).length
  const b2cOnly = analysis.filter((a) => a.b2c && !a.b2b).length
  const both = analysis.filter((a) => a.b2b && a.b2c).length
  const neither = total - b2bOnly - b2cOnly - both

  return {
    ai: [
      { label: 'Has AI/ML exp', value: aiYes, color: 'var(--green)' },
      { label: 'No AI/ML exp', value: total - aiYes, color: 'var(--border)' },
    ],
    fintech: [
      { label: 'Has Fintech exp', value: finYes, color: 'var(--purple)' },
      { label: 'No Fintech exp', value: total - finYes, color: 'var(--border)' },
    ],
    b2bB2c: [
      { label: 'B2B only', value: b2bOnly, color: 'var(--blue)' },
      { label: 'B2C only', value: b2cOnly, color: 'var(--amber)' },
      { label: 'Both', value: both, color: 'var(--green)' },
      { label: 'Neither', value: neither, color: 'var(--border)' },
    ],
  }
}

// ── Domain heatmap ───────────────────────────────────────────────────────────

export function computeHeatmap(
  data: {
    candidate: { name: string }
    analysis: { domains: string[] | null } | null
  }[],
): HeatmapData {
  const domainSet = new Set<string>()
  for (const d of data) for (const dom of d.analysis?.domains ?? []) domainSet.add(dom)
  const domains = Array.from(domainSet).sort()

  return {
    candidateNames: data.map((d) => d.candidate.name.split(' ')[0]),
    domains,
    grid: data.map((d) => domains.map((dom) => (d.analysis?.domains ?? []).includes(dom))),
  }
}

// ── Comparison table rows ────────────────────────────────────────────────────

export function computeComparisonRows(
  data: {
    candidate: {
      id: string
      name: string
      salary_amount: number | null
      salary_currency: string | null
      salary_period: string | null
      notice: string | null
      seniority: string | null
    }
    profile: { fit_score: number | null } | null
    analysis: {
      pm_exp: number | null
      total_exp: number | null
      ai_exp: boolean
      fintech: boolean
      b2b: boolean
      b2c: boolean
      university: string | null
      grad_year: number | null
      masters: string | null
    } | null
  }[],
  stateMap: Record<string, { verdict: string | null }>,
): ComparisonRow[] {
  return data
    .map((d) => ({
      id: d.candidate.id,
      name: d.candidate.name,
      fitScore: d.profile?.fit_score ?? null,
      pmExp: d.analysis?.pm_exp ?? null,
      totalExp: d.analysis?.total_exp ?? null,
      aiExp: d.analysis?.ai_exp ?? false,
      fintech: d.analysis?.fintech ?? false,
      b2b: d.analysis?.b2b ?? false,
      b2c: d.analysis?.b2c ?? false,
      university: d.analysis?.university ?? null,
      gradYear: d.analysis?.grad_year ?? null,
      masters: d.analysis?.masters === 'true',
      salaryAmount: d.candidate.salary_amount,
      salaryCurrency: d.candidate.salary_currency,
      salaryPeriod: d.candidate.salary_period,
      notice: d.candidate.notice,
      seniority: d.candidate.seniority,
      verdict: stateMap[d.candidate.id]?.verdict ?? null,
    }))
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
}

// ── Key highlights ───────────────────────────────────────────────────────────

export function computeKeyHighlights(
  data: {
    candidate: {
      name: string
      notice: string | null
      salary_amount: number | null
      salary_currency: string | null
      salary_period: string | null
    }
    profile: { fit_score: number | null } | null
    analysis: {
      pm_exp: number | null
      total_exp: number | null
      ai_exp: boolean
    } | null
  }[],
  salaryToEGP: (a: number | null, c: string | null, p: string | null) => number | null,
): Highlight[] {
  const highlights: Highlight[] = []

  const byFit = [...data].sort((a, b) => (b.profile?.fit_score ?? 0) - (a.profile?.fit_score ?? 0))
  if (byFit[0]) {
    highlights.push({
      title: '🏆 Highest fit score',
      value: byFit[0].candidate.name,
      sub: `${byFit[0].profile?.fit_score ?? 0}% fit`,
    })
  }

  const byPmExp = [...data].sort((a, b) => (b.analysis?.pm_exp ?? 0) - (a.analysis?.pm_exp ?? 0))
  if (byPmExp[0] && (byPmExp[0].analysis?.pm_exp ?? 0) > 0) {
    highlights.push({
      title: '💼 Most PM experience',
      value: byPmExp[0].candidate.name,
      sub: `${byPmExp[0].analysis!.pm_exp} years in PM`,
    })
  }

  const aiCandidates = data.filter((d) => d.analysis?.ai_exp)
  highlights.push({
    title: '🤖 AI/ML experience',
    value: `${aiCandidates.length} of ${data.length} candidates`,
    sub: aiCandidates.map((d) => d.candidate.name.split(' ')[0]).join(', ') || 'None',
  })

  const immediate = data.filter((d) => d.candidate.notice?.toLowerCase() === 'immediate')
  if (immediate.length > 0) {
    highlights.push({
      title: '⚡ Available immediately',
      value: `${immediate.length} candidate${immediate.length > 1 ? 's' : ''}`,
      sub: immediate.map((d) => d.candidate.name.split(' ')[0]).join(', '),
    })
  }

  const salaries = data
    .map((d) =>
      salaryToEGP(
        d.candidate.salary_amount,
        d.candidate.salary_currency,
        d.candidate.salary_period,
      ),
    )
    .filter((v): v is number => v !== null)
  if (salaries.length > 0) {
    const min = Math.min(...salaries)
    const max = Math.max(...salaries)
    highlights.push({
      title: '💰 Salary range',
      value: `${Math.round(min / 1000)}K – ${Math.round(max / 1000)}K EGP/month`,
      sub: `${salaries.length} candidates with declared salary`,
    })
  }

  return highlights
}
