import { usePipelineStats } from '@/hooks/usePipelineStats'

export function PipelineHealthSnapshot() {
  const stats = usePipelineStats()
  if (!stats) return null

  const scorecardPct =
    stats.totalCount > 0 ? Math.round((stats.scorecardFilledCount / stats.totalCount) * 100) : 0
  const verdictPct =
    stats.totalCount > 0 ? Math.round((stats.withVerdictCount / stats.totalCount) * 100) : 0

  return (
    <div className="hidden md:flex items-center gap-4 text-[11px] font-sans text-text3">
      <span>
        <span className="font-semibold text-text">{scorecardPct}%</span> scored
      </span>
      <span>
        <span className="font-semibold text-text">{verdictPct}%</span> verdicted
      </span>
      <span>
        Day <span className="font-semibold text-text">{stats.daysSinceStart + 1}</span>
      </span>
    </div>
  )
}
