import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { BriefCard } from '@/components/briefing/BriefCard'
import { printBriefCard } from '@/lib/exports'

const DAYS = [
  'All',
  'Sunday 17 May',
  'Monday 18 May',
  'Tuesday 19 May',
  'Wednesday 20 May',
  'Thursday 21 May',
]

export function BriefingPage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const [day, setDay] = useState('All')

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" />
      </div>
    )

  const filtered = data
    .filter((d) => day === 'All' || d.candidate.day === day)
    .sort((a, b) => (a.candidate.time ?? '').localeCompare(b.candidate.time ?? ''))

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Day Briefing</h1>
      <p className="text-text2 text-[13.5px] mb-5">
        Pre-interview briefs with candidate summaries and interview timer.
      </p>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium font-sans border transition-all cursor-pointer ${
              day === d
                ? 'bg-text text-bg border-text'
                : 'bg-surface border-border text-text2 hover:border-border-strong hover:text-text'
            }`}
          >
            {d === 'All' ? 'All Days' : d.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text3">No interviews scheduled for this day.</div>
      ) : (
        filtered.map(({ candidate, ...rest }) => {
          const state = stateMap[candidate.id]
          if (!state) return null
          return (
            <BriefCard
              key={candidate.id}
              data={{ candidate, ...rest }}
              state={state}
              onPrintBrief={() => printBriefCard({ candidate, ...rest }, state)}
            />
          )
        })
      )}
    </div>
  )
}
