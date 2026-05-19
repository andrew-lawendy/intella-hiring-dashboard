// src/components/profile/ProfileSnapshotSection.tsx
import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { ChipInput } from '@/components/ui/chip-input'
import { Button } from '@/components/ui/button'
import { FieldWrapper, ScoreSlider, SectionTitle } from '@/components/candidates/form-helpers'
import { fitColorFromScore } from '@/lib/scoring'
import { useUpdateCandidateProfile } from '@/hooks/useUpdateCandidateProfile'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['candidate_profiles']['Row']

interface ProfileSnapshotSectionProps {
  profile: Profile
}

const DOMAIN_SCORES = [
  { key: 'aiScore' as const, dbKey: 'ai_score' as const, label: 'AI / Tech' },
  { key: 'fintechScore' as const, dbKey: 'fintech_score' as const, label: 'FinTech' },
  { key: 'b2bScore' as const, dbKey: 'b2b_score' as const, label: 'B2B experience' },
  { key: 'seniorityScore' as const, dbKey: 'seniority_score' as const, label: 'Seniority' },
]

interface DraftState {
  summary: string
  strengths: string[]
  watchFor: string
  fitScore: number
  aiScore: number
  fintechScore: number
  b2bScore: number
  seniorityScore: number
}

function draftFromProfile(profile: Profile): DraftState {
  return {
    summary: profile.summary ?? '',
    strengths: profile.strengths ?? [],
    watchFor: profile.watch_for ?? '',
    fitScore: profile.fit_score ?? 75,
    aiScore: profile.ai_score ?? 3,
    fintechScore: profile.fintech_score ?? 3,
    b2bScore: profile.b2b_score ?? 3,
    seniorityScore: profile.seniority_score ?? 3,
  }
}

export function ProfileSnapshotSection({ profile }: ProfileSnapshotSectionProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftState>(() => draftFromProfile(profile))
  const { mutateAsync: updateProfile, isPending } = useUpdateCandidateProfile(profile.candidate_id)

  function startEdit() {
    setDraft(draftFromProfile(profile))
    setEditing(true)
  }

  async function save() {
    await updateProfile({
      summary: draft.summary.trim() || null,
      strengths: draft.strengths.length ? draft.strengths : null,
      watch_for: draft.watchFor.trim() || null,
      fit_score: draft.fitScore,
      ai_score: draft.aiScore,
      fintech_score: draft.fintechScore,
      b2b_score: draft.b2bScore,
      seniority_score: draft.seniorityScore,
    })
    setEditing(false)
  }

  const fitBars = [
    { label: 'AI Experience', value: profile.ai_score ?? 0 },
    { label: 'Fintech', value: profile.fintech_score ?? 0 },
    { label: 'B2B', value: profile.b2b_score ?? 0 },
    { label: 'Seniority', value: profile.seniority_score ?? 0 },
  ]

  return (
    <div className="py-5 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Profile Snapshot
        </p>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit profile snapshot"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <PencilIcon className="size-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-5">
          <FieldWrapper label="Overall fit score" optional hint="0 – 100">
            <ScoreSlider
              value={draft.fitScore}
              onChange={(v) => setDraft((d) => ({ ...d, fitScore: v }))}
              min={0}
              max={100}
              label="Overall fit score"
            />
          </FieldWrapper>
          <FieldWrapper label="Brief summary" optional>
            <Textarea
              value={draft.summary}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              rows={3}
              placeholder="Brief candidate summary…"
            />
          </FieldWrapper>
          <FieldWrapper label="Strengths" optional hint="Press Enter or comma to add">
            <ChipInput
              value={draft.strengths}
              onChange={(v) => setDraft((d) => ({ ...d, strengths: v }))}
              placeholder="e.g. Stakeholder management"
            />
          </FieldWrapper>
          <FieldWrapper label="Watch for in interview" optional>
            <Textarea
              value={draft.watchFor}
              onChange={(e) => setDraft((d) => ({ ...d, watchFor: e.target.value }))}
              rows={2}
              placeholder="What should the interviewer probe on?"
            />
          </FieldWrapper>
          <SectionTitle>Domain scores</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {DOMAIN_SCORES.map(({ key, label }) => (
              <FieldWrapper key={key} label={label} optional hint="0 – 5">
                <ScoreSlider
                  value={draft[key]}
                  onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                  min={0}
                  max={5}
                  label={label}
                />
              </FieldWrapper>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(draftFromProfile(profile))
                setEditing(false)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={save} loading={isPending}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[28px] font-medium tracking-tight text-foreground">
                {profile.fit_score ?? '—'}%
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
            {profile.summary && (
              <p className="text-[13px] text-muted-foreground leading-relaxed">{profile.summary}</p>
            )}
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
              Fit Breakdown
            </p>
            {fitBars.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3 mb-2 text-xs">
                <span className="text-muted-foreground w-28 flex-shrink-0">{bar.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${(bar.value / 5) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground font-mono text-[12px]">{bar.value}/5</span>
              </div>
            ))}
          </div>

          {(profile.strengths ?? []).length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Strengths
              </p>
              {(profile.strengths ?? []).map((s) => (
                <div key={s} className="text-[12.5px] text-[var(--green)] mb-1.5">
                  ✓ {s}
                </div>
              ))}
            </div>
          )}

          {(profile.weaknesses ?? []).length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Weaknesses
              </p>
              {(profile.weaknesses ?? []).map((w) => (
                <div key={w} className="text-[12.5px] text-[var(--red)] mb-1.5">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          {profile.watch_for && (
            <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-line)] rounded-[var(--radius-xs)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--amber)] mb-1">
                Watch For
              </p>
              <p className="text-[12.5px] text-muted-foreground">{profile.watch_for}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
