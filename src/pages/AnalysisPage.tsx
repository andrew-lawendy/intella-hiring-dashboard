// src/pages/AnalysisPage.tsx
import { useNavigate } from 'react-router-dom'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import {
  computeKPIs,
  computeDomainFrequency,
  computeRanking,
  computePmExpBars,
  computeSalaryBars,
  computeEducationData,
  computeDomainCoverage,
  computeHeatmap,
  computeComparisonRows,
  computeKeyHighlights,
} from '@/lib/analytics'
import { salaryToEGP } from '@/lib/salary'
import { KPICards } from '@/components/analysis/KPICards'
import { HorizontalBar } from '@/components/analysis/HorizontalBar'
import { ScatterPlot } from '@/components/analysis/ScatterPlot'
import { DonutChart } from '@/components/analysis/DonutChart'
import { DomainHeatmap } from '@/components/analysis/DomainHeatmap'
import { ExpandableRankingCard } from '@/components/analysis/ExpandableRankingCard'
import { ComparisonTable } from '@/components/analysis/ComparisonTable'
import { KeyHighlights } from '@/components/analysis/KeyHighlights'
import { InterviewerAccountability } from '@/components/analysis/InterviewerAccountability'
import { Spinner } from '@/components/ui/spinner'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text3">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">
        {title}
      </p>
      {children}
    </div>
  )
}

export function AnalysisPage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const navigate = useNavigate()

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const analysisRows = data
    .map((d) => d.analysis)
    .filter((a): a is NonNullable<typeof a> => a !== null)
  const stateRows = Object.values(stateMap)
  const kpis = computeKPIs(analysisRows, stateRows)
  const domainFreq = computeDomainFrequency(analysisRows)
  const rawRanking = computeRanking(analysisRows, stateMap, {})

  // existing charts
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

  // new sections
  const pmExpData = computePmExpBars(data)
  const salaryBars = computeSalaryBars(data, salaryToEGP)
  const { degreeSlices, gradYearBars } = computeEducationData(data)
  const {
    ai: aiSlices,
    fintech: fintechSlices,
    b2bB2c: b2bSlices,
  } = computeDomainCoverage(analysisRows)
  const heatmapData = computeHeatmap(data)
  const comparisonRows = computeComparisonRows(data, stateMap)
  const highlights = computeKeyHighlights(data, salaryToEGP)

  const rankingCards = rawRanking.map((e) => {
    const d = data.find((x) => x.candidate.id === e.candidateId)
    return {
      ...e,
      name: d?.candidate.name ?? e.candidateId,
      fitScore: d?.profile?.fit_score ?? null,
      strengths: d?.profile?.strengths ?? [],
      watchFor: d?.profile?.watch_for ?? null,
    }
  })

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">📊 Analysis</h1>
      <p className="text-text2 text-[13.5px] mb-8">
        Candidate pool analysis for May 2026 Senior PM hiring round.
      </p>

      {/* KPIs */}
      <div className="mb-8">
        <KPICards kpis={kpis} />
      </div>

      {/* Key Highlights */}
      <div className="mb-8">
        <SectionTitle>Key Highlights</SectionTitle>
        <KeyHighlights highlights={highlights} />
      </div>

      {/* Experience Overview */}
      <div className="mb-8">
        <SectionTitle>Experience Overview</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <ChartCard title="Total Years Experience">
            <HorizontalBar data={expData} unit="y" />
          </ChartCard>
          <ChartCard title="PM Experience">
            <HorizontalBar data={pmExpData} unit="y" />
          </ChartCard>
        </div>
        <ChartCard title="PM Exp vs Fit Score — scatter">
          <ScatterPlot points={scatterPoints} xLabel="PM Experience (yrs)" yLabel="Fit Score (%)" />
        </ChartCard>
      </div>

      {/* Salary Comparison */}
      {salaryBars.length > 0 && (
        <div className="mb-8">
          <SectionTitle>Salary Comparison</SectionTitle>
          <ChartCard title="All candidates — sorted highest to lowest (red = premium, blue = mid, green = competitive)">
            <HorizontalBar data={salaryBars} />
          </ChartCard>
        </div>
      )}

      {/* Education */}
      <div className="mb-8">
        <SectionTitle>Education</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Degree Type Distribution">
            <DonutChart slices={degreeSlices} />
          </ChartCard>
          <ChartCard title="Graduation Year — blue 2020+, amber 2016–2019, grey before 2016">
            <HorizontalBar data={gradYearBars} />
          </ChartCard>
        </div>
      </div>

      {/* Domain & Skills Coverage */}
      <div className="mb-8">
        <SectionTitle>Domain & Skills Coverage</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ChartCard title="AI / Tech Experience">
            <DonutChart slices={aiSlices} />
          </ChartCard>
          <ChartCard title="Fintech Experience">
            <DonutChart slices={fintechSlices} />
          </ChartCard>
          <ChartCard title="B2B vs B2C Focus">
            <DonutChart slices={b2bSlices} />
          </ChartCard>
        </div>
        <ChartCard title="Domain Heatmap — coloured cells show coverage, hover for name">
          <DomainHeatmap data={heatmapData} />
        </ChartCard>
        <div className="mt-4">
          <ChartCard title="Domain Frequency">
            <HorizontalBar data={domainData} />
          </ChartCard>
        </div>
      </div>

      {/* Candidate Ranking */}
      <div className="mb-8">
        <SectionTitle>🏆 Candidate Ranking — click any card to expand</SectionTitle>
        <ExpandableRankingCard entries={rankingCards} />
      </div>

      {/* Full Comparison Table */}
      <div className="mb-8">
        <SectionTitle>Full Comparison Table</SectionTitle>
        <ComparisonTable
          rows={comparisonRows}
          onNameClick={(id) => navigate(`/cards?profile=${id}`)}
        />
      </div>

      {/* Interviewer Accountability */}
      <div className="mb-8">
        <SectionTitle>Interviewer Accountability</SectionTitle>
        <InterviewerAccountability />
      </div>
    </div>
  )
}
