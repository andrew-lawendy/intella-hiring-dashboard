import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChipInput } from '@/components/ui/chip-input'
import { FieldWrapper, ScoreSlider, SectionTitle } from '../form-helpers'
import type { CreateCandidateInput } from '@/hooks/useCreateCandidate'

interface StepProfileProps {
  values: CreateCandidateInput
  setField: <K extends keyof CreateCandidateInput>(k: K, v: CreateCandidateInput[K]) => void
}

const DOMAIN_SCORES: { key: keyof CreateCandidateInput; label: string }[] = [
  { key: 'aiScore', label: 'AI / Tech' },
  { key: 'fintechScore', label: 'FinTech' },
  { key: 'b2bScore', label: 'B2B experience' },
  { key: 'seniorityScore', label: 'Seniority' },
]

export function StepProfile({ values, setField }: StepProfileProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground mb-0.5">Profile</h3>
        <p className="text-[13px] text-muted-foreground">
          A snapshot from their CV. Everything here is optional — fill in what you know.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Current title" optional htmlFor="field-title">
          <Input
            id="field-title"
            type="text"
            placeholder="e.g. Product Manager"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            autoComplete="organization-title"
          />
        </FieldWrapper>

        <FieldWrapper label="Current company" optional htmlFor="field-company">
          <Input
            id="field-company"
            type="text"
            placeholder="e.g. Cartona"
            value={values.company}
            onChange={(e) => setField('company', e.target.value)}
            autoComplete="organization"
          />
        </FieldWrapper>
      </div>

      <FieldWrapper
        label="Brief summary"
        optional
        htmlFor="field-summary"
        hint="2–3 sentences. Will appear on the candidate card."
      >
        <Textarea
          id="field-summary"
          placeholder="What's the one-paragraph version of this person?"
          value={values.summary}
          onChange={(e) => setField('summary', e.target.value)}
          rows={3}
        />
      </FieldWrapper>

      <FieldWrapper
        label="Strengths"
        optional
        htmlFor="field-strengths"
        hint="Press Enter or comma to add"
      >
        <ChipInput
          id="field-strengths"
          value={values.strengths}
          onChange={(v) => setField('strengths', v)}
          placeholder="e.g. Stakeholder management"
        />
      </FieldWrapper>

      <FieldWrapper label="Watch for in interview" optional htmlFor="field-watch-for">
        <Textarea
          id="field-watch-for"
          placeholder="What should the interviewer probe on?"
          value={values.watchFor}
          onChange={(e) => setField('watchFor', e.target.value)}
          rows={2}
        />
      </FieldWrapper>

      <div className="flex flex-col gap-4 pt-1">
        <SectionTitle>Initial fit assessment</SectionTitle>

        <FieldWrapper
          label="Overall fit score"
          optional
          htmlFor="field-fit-score"
          hint="Your gut read after the CV review"
        >
          <ScoreSlider
            value={values.fitScore}
            onChange={(v) => setField('fitScore', v)}
            min={0}
            max={100}
            label="Overall fit score"
          />
        </FieldWrapper>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {DOMAIN_SCORES.map(({ key, label }) => (
            <FieldWrapper key={key} label={label} optional hint="0 – 5">
              <ScoreSlider
                value={values[key] as number}
                onChange={(v) => setField(key, v as never)}
                min={0}
                max={5}
                label={label}
              />
            </FieldWrapper>
          ))}
        </div>
      </div>
    </div>
  )
}
