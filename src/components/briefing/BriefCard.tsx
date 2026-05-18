import { InterviewTimer } from './InterviewTimer'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { fitColorFromScore } from '@/lib/scoring'

type State = Database['public']['Tables']['interview_state']['Row']

interface BriefCardProps {
  data: CandidateWithDetails
  state: State
  onPrintBrief: () => void
}

export function BriefCard({ data, state, onPrintBrief }: BriefCardProps) {
  const { candidate, profile, analysis } = data

  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] mb-3.5 overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-px transition-all">
      <div className="bg-gradient-to-b from-surface2 to-surface px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[18px] font-semibold text-text tracking-tight">
            {candidate.time}
          </span>
          <div>
            <p className="text-[17px] font-semibold tracking-tight text-text">{candidate.name}</p>
            <p className="text-[12px] text-text2 mt-0.5">{candidate.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InterviewTimer />
          <Button size="sm" variant="outline" onClick={onPrintBrief}>
            Print Brief
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex gap-5 flex-wrap text-[12.5px] mb-3">
          {[
            { label: 'Slot', value: candidate.slot },
            { label: 'Type', value: candidate.type },
            { label: 'Salary', value: candidate.salary },
            { label: 'Notice', value: candidate.notice },
            ...(analysis
              ? [
                  {
                    label: 'Role',
                    value: `${analysis.current_role ?? '—'} @ ${analysis.current_company ?? '—'}`,
                  },
                  {
                    label: 'Experience',
                    value: `${analysis.total_exp ?? '?'}y total, ${analysis.pm_exp ?? '?'}y PM`,
                  },
                ]
              : []),
          ].map((item) => (
            <span key={item.label} className="text-text2">
              <strong className="text-text font-medium">{item.label}:</strong> {item.value ?? '—'}
            </span>
          ))}
        </div>

        {profile && (
          <div className="flex gap-2 flex-wrap">
            <span
              className="text-[12px] font-medium px-2 py-0.5 rounded-full border"
              style={{
                background: `color-mix(in srgb, ${fitColorFromScore(profile.fit_score)} 15%, transparent)`,
                borderColor: `color-mix(in srgb, ${fitColorFromScore(profile.fit_score)} 30%, transparent)`,
                color: fitColorFromScore(profile.fit_score),
              }}
            >
              {profile.fit_label} · {profile.fit_score}%
            </span>
            {state.confirmed && (
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full border bg-[var(--green-bg)] text-[var(--green)] border-[var(--green-line)]">
                Confirmed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
