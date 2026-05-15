import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { computeKPIs, computeDomainFrequency, computeRanking } from '@/lib/analytics'
import { KPICards } from '@/components/analysis/KPICards'
import { HorizontalBar } from '@/components/analysis/HorizontalBar'
import { ScatterPlot } from '@/components/analysis/ScatterPlot'
import { RankingTable } from '@/components/analysis/RankingTable'
import { InterviewerAccountability } from '@/components/analysis/InterviewerAccountability'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text3">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export function AnalysisPage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" />
      </div>
    )

  const analysisRows = data
    .map((d) => d.analysis)
    .filter((a): a is NonNullable<typeof a> => a !== null)
  const stateRows = Object.values(stateMap)
  const kpis = computeKPIs(analysisRows, stateRows)
  const domainFreq = computeDomainFrequency(analysisRows)
  const ranking = computeRanking(analysisRows, stateMap, {})
  const nameMap = Object.fromEntries(data.map((d) => [d.candidate.id, d.candidate.name]))

  const expData = data
    .map((d) => ({ label: d.candidate.name.split(' ')[0], value: d.analysis?.total_exp ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)

  const domainData = Object.entries(domainFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, value]) => ({ label, value }))

  const scatterPoints = data.map((d, i) => ({
    id: d.candidate.id,
    name: d.candidate.name,
    x: d.analysis?.pm_exp ?? 0,
    y: d.profile?.fit_score ?? 0,
    color: `oklch(0.55 0.12 ${(i * 37) % 360})`,
  }))

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">📊 Analysis</h1>
      <p className="text-text2 text-[13.5px] mb-8">
        Candidate pool analysis for May 2026 Senior PM hiring round.
      </p>

      <div className="mb-8">
        <KPICards kpis={kpis} />
      </div>

      <div className="mb-8">
        <SectionTitle>Experience Distribution</SectionTitle>
        <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">
            Total Years Experience
          </p>
          <HorizontalBar data={expData} unit="y" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">
            Domain Frequency
          </p>
          <HorizontalBar data={domainData} />
        </div>
        <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">
            PM Exp vs Fit Score
          </p>
          <ScatterPlot points={scatterPoints} xLabel="PM Experience (yrs)" yLabel="Fit Score (%)" />
        </div>
      </div>

      <div className="mb-8">
        <SectionTitle>Candidate Ranking</SectionTitle>
        <RankingTable entries={ranking} nameMap={nameMap} />
      </div>

      <div className="mb-8">
        <SectionTitle>Interviewer Accountability</SectionTitle>
        <InterviewerAccountability />
      </div>
    </div>
  )
}
