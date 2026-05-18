import { TriangleAlertIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FieldWrapper, SegmentedToggle } from '../form-helpers'
import type { CreateCandidateInput } from '@/hooks/useCreateCandidate'
import { useJobOpenings } from '@/hooks/useJobOpenings'
import { formatRoundDateRange } from '@/hooks/useHiringRound'

interface StepIdentityProps {
  values: CreateCandidateInput
  setField: <K extends keyof CreateCandidateInput>(k: K, v: CreateCandidateInput[K]) => void
  errors: Record<string, string>
  duplicateEmail: string | null
}

export function StepIdentity({ values, setField, errors, duplicateEmail }: StepIdentityProps) {
  const { data: jobs = [] } = useJobOpenings()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground mb-0.5">Identity</h3>
        <p className="text-[13px] text-muted-foreground">
          Who's joining the pipeline. Name and email are required; everything else can be set later.
        </p>
      </div>

      <FieldWrapper label="Role / Opening" required htmlFor="field-job" error={errors.jobId}>
        <select
          id="field-job"
          value={values.jobId?.toString() ?? ''}
          onChange={(e) => setField('jobId', e.target.value ? parseInt(e.target.value) : null)}
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-invalid={!!errors.jobId}
        >
          <option value="">Select a role…</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id.toString()}>
              {job.role} · {formatRoundDateRange(job.start_date, job.end_date)}
              {job.is_active ? ' (active)' : ''}
            </option>
          ))}
        </select>
      </FieldWrapper>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Full name" required htmlFor="field-name" error={errors.name}>
          <Input
            id="field-name"
            type="text"
            placeholder="e.g. Yasmin Najjar"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'field-name-error' : undefined}
          />
        </FieldWrapper>

        <FieldWrapper label="Email" required htmlFor="field-email" error={errors.email}>
          <Input
            id="field-email"
            type="email"
            placeholder="yasmin@example.com"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'field-email-error' : undefined}
          />
        </FieldWrapper>
      </div>

      {duplicateEmail && (
        <div
          role="status"
          className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[12.5px] text-amber-800 dark:text-amber-300"
        >
          <TriangleAlertIcon className="size-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <strong className="font-medium">{duplicateEmail}</strong> matches an existing candidate.
            You can still add them — they'll appear as a possible duplicate.
          </div>
        </div>
      )}

      <FieldWrapper label="Interview type" htmlFor="field-type">
        <SegmentedToggle
          value={values.interviewType}
          onChange={(v) => setField('interviewType', v as 'Remote' | 'In-person')}
          options={[
            { value: 'Remote', label: 'Remote' },
            { value: 'In-person', label: 'In-person' },
          ]}
        />
      </FieldWrapper>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper
          label="Expected salary"
          optional
          htmlFor="field-salary"
          hint="Monthly net, EGP"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-muted-foreground">
              EGP
            </span>
            <Input
              id="field-salary"
              type="text"
              placeholder="65,000"
              value={values.salary}
              onChange={(e) => setField('salary', e.target.value)}
              inputMode="numeric"
              className="pl-10"
            />
          </div>
        </FieldWrapper>

        <FieldWrapper label="Notice period" optional htmlFor="field-notice">
          <Input
            id="field-notice"
            type="text"
            placeholder="e.g. 2 months"
            value={values.notice}
            onChange={(e) => setField('notice', e.target.value)}
          />
        </FieldWrapper>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrapper label="Interview date" optional htmlFor="field-slot-date">
          <Input
            id="field-slot-date"
            type="date"
            value={values.slotDate}
            onChange={(e) => setField('slotDate', e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper label="Interview time" optional htmlFor="field-slot-time">
          <Input
            id="field-slot-time"
            type="time"
            value={values.slotTime}
            onChange={(e) => setField('slotTime', e.target.value)}
          />
        </FieldWrapper>
      </div>
    </div>
  )
}
