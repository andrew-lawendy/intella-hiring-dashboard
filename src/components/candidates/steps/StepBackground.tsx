import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChipInput } from '@/components/ui/chip-input'
import { FieldWrapper, SectionTitle } from '../form-helpers'
import { cn } from '@/lib/utils'
import type { CreateCandidateInput } from '@/hooks/useCreateCandidate'

interface StepBackgroundProps {
  values: CreateCandidateInput
  setField: <K extends keyof CreateCandidateInput>(k: K, v: CreateCandidateInput[K]) => void
}

const EXP_FLAGS: { key: keyof CreateCandidateInput; label: string }[] = [
  { key: 'hasAI', label: 'AI / ML' },
  { key: 'hasB2B', label: 'B2B' },
  { key: 'hasB2C', label: 'B2C' },
  { key: 'hasFintech', label: 'FinTech' },
]

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

export function StepBackground({ values, setField }: StepBackgroundProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground mb-0.5">Background</h3>
        <p className="text-[13px] text-muted-foreground">
          Education, experience, and domains. All optional but powers the comparison view.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Education</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="University" optional htmlFor="field-university">
            <Input
              id="field-university"
              type="text"
              placeholder="e.g. AUC"
              value={values.university}
              onChange={(e) => setField('university', e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper label="Degree" optional htmlFor="field-degree">
            <Input
              id="field-degree"
              type="text"
              placeholder="e.g. BSc Computer Science"
              value={values.degree}
              onChange={(e) => setField('degree', e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper label="Graduation year" optional htmlFor="field-grad-year">
            <Input
              id="field-grad-year"
              type="text"
              placeholder="2020"
              value={values.gradYear}
              onChange={(e) => setField('gradYear', e.target.value)}
              inputMode="numeric"
            />
          </FieldWrapper>

          <FieldWrapper label="Postgraduate" optional htmlFor="field-masters">
            <CheckItem
              id="field-masters"
              checked={values.masters}
              onChange={(v) => setField('masters', v)}
              label="Has Master's degree"
            />
          </FieldWrapper>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Experience</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Total experience" optional htmlFor="field-total-exp" hint="Years">
            <Input
              id="field-total-exp"
              type="text"
              placeholder="e.g. 7"
              value={values.totalExp}
              onChange={(e) => setField('totalExp', e.target.value)}
              inputMode="decimal"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Role-relevant experience"
            optional
            htmlFor="field-pm-exp"
            hint="Years"
          >
            <Input
              id="field-pm-exp"
              type="text"
              placeholder="e.g. 4"
              value={values.pmExp}
              onChange={(e) => setField('pmExp', e.target.value)}
              inputMode="decimal"
            />
          </FieldWrapper>
        </div>

        <FieldWrapper
          label="Domains worked in"
          optional
          htmlFor="field-domains"
          hint="Press Enter to add"
        >
          <ChipInput
            id="field-domains"
            value={values.domains}
            onChange={(v) => setField('domains', v)}
            placeholder="e.g. FinTech, B2B, Healthcare"
          />
        </FieldWrapper>

        <FieldWrapper label="Experience flags" optional>
          <div className="grid grid-cols-2 gap-2">
            {EXP_FLAGS.map(({ key, label }) => (
              <CheckItem
                key={key}
                id={`field-flag-${key}`}
                checked={values[key] as boolean}
                onChange={(v) => setField(key, v as never)}
                label={label}
              />
            ))}
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Notable"
          optional
          htmlFor="field-notable"
          hint="Anything else worth flagging for the team"
        >
          <Textarea
            id="field-notable"
            placeholder="e.g. Strong design taste, ex-founder, open-source maintainer…"
            value={values.notable}
            onChange={(e) => setField('notable', e.target.value)}
            rows={3}
          />
        </FieldWrapper>
      </div>
    </div>
  )
}
