// src/components/profile/ProfileBackgroundSection.tsx
import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChipInput } from '@/components/ui/chip-input'
import { Button } from '@/components/ui/button'
import { FieldWrapper, SectionTitle } from '@/components/candidates/form-helpers'
import { useUpdateCandidateAnalysis } from '@/hooks/useUpdateCandidateAnalysis'
import type { Database } from '@/lib/database.types'

type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

interface ProfileBackgroundSectionProps {
  analysis: Analysis | null
  candidateId: string
}

function CheckItem({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  id: string
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium select-none',
        checked
          ? 'bg-primary/8 border-primary/25 text-primary'
          : 'border-input text-muted-foreground hover:border-border hover:text-foreground',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
          checked ? 'bg-primary border-primary' : 'border-input',
        )}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}

const EXP_FLAGS: {
  key: 'ai_exp' | 'b2b' | 'b2c' | 'fintech'
  draftKey: 'hasAI' | 'hasB2B' | 'hasB2C' | 'hasFintech'
  label: string
}[] = [
  { key: 'ai_exp', draftKey: 'hasAI', label: 'AI / ML' },
  { key: 'b2b', draftKey: 'hasB2B', label: 'B2B' },
  { key: 'b2c', draftKey: 'hasB2C', label: 'B2C' },
  { key: 'fintech', draftKey: 'hasFintech', label: 'FinTech' },
]

interface DraftState {
  university: string
  degree: string
  gradYear: string
  masters: boolean
  totalExp: string
  pmExp: string
  domains: string[]
  hasAI: boolean
  hasB2B: boolean
  hasB2C: boolean
  hasFintech: boolean
  notable: string
}

function draftFromAnalysis(analysis: Analysis | null): DraftState {
  return {
    university: analysis?.university ?? '',
    degree: analysis?.degree ?? '',
    gradYear: analysis?.grad_year?.toString() ?? '',
    masters: analysis?.masters === 'true',
    totalExp: analysis?.total_exp?.toString() ?? '',
    pmExp: analysis?.pm_exp?.toString() ?? '',
    domains: analysis?.domains ?? [],
    hasAI: analysis?.ai_exp ?? false,
    hasB2B: analysis?.b2b ?? false,
    hasB2C: analysis?.b2c ?? false,
    hasFintech: analysis?.fintech ?? false,
    notable: analysis?.notable ?? '',
  }
}

export function ProfileBackgroundSection({ analysis, candidateId }: ProfileBackgroundSectionProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftState>(() => draftFromAnalysis(analysis))
  const { mutateAsync: updateAnalysis, isPending } = useUpdateCandidateAnalysis(candidateId)

  function startEdit() {
    setDraft(draftFromAnalysis(analysis))
    setEditing(true)
  }

  async function save() {
    await updateAnalysis({
      university: draft.university.trim() || null,
      degree: draft.degree.trim() || null,
      grad_year: draft.gradYear ? parseInt(draft.gradYear) : null,
      masters: draft.masters ? 'true' : null,
      total_exp: draft.totalExp ? Math.round(parseFloat(draft.totalExp)) : null,
      pm_exp: draft.pmExp ? Math.round(parseFloat(draft.pmExp)) : null,
      domains: draft.domains.length ? draft.domains : null,
      ai_exp: draft.hasAI,
      b2b: draft.hasB2B,
      b2c: draft.hasB2C,
      fintech: draft.hasFintech,
      notable: draft.notable.trim() || null,
    })
    setEditing(false)
  }

  const displayGrid = [
    { label: 'University', value: analysis?.university },
    { label: 'Degree', value: analysis?.degree },
    { label: 'Grad Year', value: analysis?.grad_year?.toString() },
    { label: "Master's", value: analysis?.masters === 'true' ? 'Yes' : null },
    { label: 'Total Exp', value: analysis?.total_exp != null ? `${analysis.total_exp} yrs` : null },
    { label: 'Relevant Exp', value: analysis?.pm_exp != null ? `${analysis.pm_exp} yrs` : null },
    { label: 'Current Role', value: analysis?.current_role },
    { label: 'Company', value: analysis?.current_company },
  ]

  const activeFlags = EXP_FLAGS.filter(({ key }) => analysis?.[key])

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Background
        </p>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit background"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <PencilIcon className="size-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <SectionTitle>Education</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="University" optional htmlFor="edit-university">
                <Input
                  id="edit-university"
                  value={draft.university}
                  onChange={(e) => setDraft((d) => ({ ...d, university: e.target.value }))}
                  placeholder="e.g. AUC"
                />
              </FieldWrapper>
              <FieldWrapper label="Degree" optional htmlFor="edit-degree">
                <Input
                  id="edit-degree"
                  value={draft.degree}
                  onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value }))}
                  placeholder="e.g. BSc Computer Science"
                />
              </FieldWrapper>
              <FieldWrapper label="Graduation year" optional htmlFor="edit-grad-year">
                <Input
                  id="edit-grad-year"
                  value={draft.gradYear}
                  onChange={(e) => setDraft((d) => ({ ...d, gradYear: e.target.value }))}
                  placeholder="2020"
                  inputMode="numeric"
                />
              </FieldWrapper>
              <FieldWrapper label="Postgraduate" optional htmlFor="edit-masters">
                <CheckItem
                  id="edit-masters"
                  checked={draft.masters}
                  onChange={(v) => setDraft((d) => ({ ...d, masters: v }))}
                  label="Has Master's degree"
                />
              </FieldWrapper>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SectionTitle>Experience</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Total experience" optional htmlFor="edit-total-exp" hint="Years">
                <Input
                  id="edit-total-exp"
                  value={draft.totalExp}
                  onChange={(e) => setDraft((d) => ({ ...d, totalExp: e.target.value }))}
                  placeholder="e.g. 7"
                  inputMode="decimal"
                />
              </FieldWrapper>
              <FieldWrapper
                label="Role-relevant experience"
                optional
                htmlFor="edit-pm-exp"
                hint="Years"
              >
                <Input
                  id="edit-pm-exp"
                  value={draft.pmExp}
                  onChange={(e) => setDraft((d) => ({ ...d, pmExp: e.target.value }))}
                  placeholder="e.g. 4"
                  inputMode="decimal"
                />
              </FieldWrapper>
            </div>
            <FieldWrapper
              label="Domains worked in"
              optional
              htmlFor="edit-domains"
              hint="Press Enter to add"
            >
              <ChipInput
                id="edit-domains"
                value={draft.domains}
                onChange={(v) => setDraft((d) => ({ ...d, domains: v }))}
                placeholder="e.g. FinTech, B2B, Healthcare"
              />
            </FieldWrapper>
            <FieldWrapper label="Experience flags" optional>
              <div className="grid grid-cols-2 gap-2">
                {EXP_FLAGS.map(({ draftKey, label }) => (
                  <CheckItem
                    key={draftKey}
                    id={`edit-flag-${draftKey}`}
                    checked={draft[draftKey]}
                    onChange={(v) => setDraft((d) => ({ ...d, [draftKey]: v }))}
                    label={label}
                  />
                ))}
              </div>
            </FieldWrapper>
            <FieldWrapper
              label="Notable"
              optional
              htmlFor="edit-notable"
              hint="Anything else worth flagging"
            >
              <Textarea
                id="edit-notable"
                value={draft.notable}
                onChange={(e) => setDraft((d) => ({ ...d, notable: e.target.value }))}
                placeholder="e.g. Strong design taste, ex-founder…"
                rows={3}
              />
            </FieldWrapper>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(draftFromAnalysis(analysis))
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
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {displayGrid.map((row) => (
              <div key={row.label} className="bg-muted/50 rounded-md p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                  {row.label}
                </p>
                <p className="text-foreground font-medium">{row.value ?? '—'}</p>
              </div>
            ))}
          </div>

          {(analysis?.domains ?? []).length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Domains
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis!.domains!.map((d) => (
                  <span
                    key={d}
                    className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeFlags.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Experience flags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeFlags.map(({ label }) => (
                  <span
                    key={label}
                    className="text-[12px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis?.notable && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Notable
              </p>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                {analysis.notable}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
