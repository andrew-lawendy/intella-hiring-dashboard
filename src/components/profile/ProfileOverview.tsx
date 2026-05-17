import type { Database } from '@/lib/database.types'
import { fitColorFromScore } from '@/lib/scoring'

type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

interface ProfileOverviewProps {
  profile: Profile
  analysis: Analysis | null
}

export function ProfileOverview({ profile, analysis }: ProfileOverviewProps) {
  const fitBars = [
    { label: 'AI Experience', value: profile.ai_score ?? 0 },
    { label: 'Fintech', value: profile.fintech_score ?? 0 },
    { label: 'B2B', value: profile.b2b_score ?? 0 },
    { label: 'Seniority', value: profile.seniority_score ?? 0 },
  ]

  return (
    <div className="p-6">
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[28px] font-medium tracking-tight text-text">
            {profile.fit_score}%
          </span>
          <span
            className="text-sm font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${fitColorFromScore(profile.fit_score)} 15%, transparent)`,
              color: fitColorFromScore(profile.fit_score),
            }}
          >
            {profile.fit_label}
          </span>
        </div>
        <p className="text-[13px] text-text2 leading-relaxed">{profile.summary}</p>
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
          Fit Breakdown
        </p>
        {fitBars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3 mb-2 text-xs">
            <span className="text-text2 w-28 flex-shrink-0">{bar.label}</span>
            <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden border border-border">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${(bar.value / 5) * 100}%` }}
              />
            </div>
            <span className="text-text3 font-mono text-[11px]">{bar.value}/5</span>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2">
          Strengths
        </p>
        {(profile.strengths ?? []).map((s, i) => (
          <div key={i} className="text-[12.5px] text-[var(--green)] mb-1.5">
            ✓ {s}
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2">
          Weaknesses
        </p>
        {(profile.weaknesses ?? []).map((w, i) => (
          <div key={i} className="text-[12.5px] text-[var(--red)] mb-1.5">
            ⚠ {w}
          </div>
        ))}
      </div>

      {profile.watch_for && (
        <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-line)] rounded-[var(--radius-xs)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--amber)] mb-1">
            Watch For
          </p>
          <p className="text-[12.5px] text-text2">{profile.watch_for}</p>
        </div>
      )}

      {analysis && (
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'University', value: analysis.university },
            { label: 'Degree', value: analysis.degree },
            {
              label: 'Total Exp',
              value: analysis.total_exp != null ? `${analysis.total_exp} yrs` : null,
            },
            { label: 'PM Exp', value: analysis.pm_exp != null ? `${analysis.pm_exp} yrs` : null },
            { label: 'Current Role', value: analysis.current_role },
            { label: 'Company', value: analysis.current_company },
          ].map((row) => (
            <div key={row.label} className="bg-surface2 rounded-[var(--radius-xs)] p-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-text3 mb-0.5">
                {row.label}
              </p>
              <p className="text-text font-medium">{row.value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
