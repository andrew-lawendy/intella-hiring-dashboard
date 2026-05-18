import { useState, useMemo } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  PlusIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useCandidateMeta } from '@/hooks/useCandidateMeta'
import { useCreateCandidate, type CreateCandidateInput } from '@/hooks/useCreateCandidate'
import { useJobs } from '@/hooks/useJobs'
import { StepIdentity } from './steps/StepIdentity'
import { StepProfile } from './steps/StepProfile'
import { StepBackground } from './steps/StepBackground'

const STEPS = [
  { key: 'identity', label: 'Identity' },
  { key: 'profile', label: 'Profile' },
  { key: 'background', label: 'Background' },
]

const DEFAULT_VALUES: Omit<CreateCandidateInput, 'jobId'> = {
  name: '',
  email: '',
  interviewType: 'Remote',
  seniority: '',
  salary: '',
  notice: '',
  slotDate: '',
  slotTime: '',
  title: '',
  company: '',
  summary: '',
  strengths: [],
  watchFor: '',
  fitScore: 75,
  aiScore: 3,
  fintechScore: 3,
  b2bScore: 3,
  seniorityScore: 3,
  university: '',
  degree: '',
  gradYear: '',
  masters: false,
  totalExp: '',
  pmExp: '',
  domains: [],
  hasAI: false,
  hasB2B: false,
  hasB2C: false,
  hasFintech: false,
  notable: '',
}

interface AddCandidateDrawerProps {
  open: boolean
  onClose: () => void
}

export function AddCandidateDrawer({ open, onClose }: AddCandidateDrawerProps) {
  const [jobSlug] = useQueryState('job', parseAsString)
  const { data: jobs = [] } = useJobs()
  const urlJobId = jobs.find((j) => j.slug === jobSlug)?.id ?? null
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [createdName, setCreatedName] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvUploadError, setCvUploadError] = useState<string | null>(null)

  const { candidates: allMeta } = useCandidateMeta()
  const { mutateAsync: createCandidate, isPending } = useCreateCandidate()

  const getInitialValues = (): CreateCandidateInput => ({ ...DEFAULT_VALUES, jobId: urlJobId })
  const [values, setValues] = useState<CreateCandidateInput>(getInitialValues)

  const debouncedEmail = useDebounce(values.email, 400)

  const duplicateEmail = useMemo(() => {
    const email = debouncedEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return null
    return allMeta.find((c) => c.email?.toLowerCase() === email)?.email ?? null
  }, [debouncedEmail, allMeta])

  function validateStep1() {
    const errs: Record<string, string> = {}
    if (values.jobId == null) errs.jobId = 'Please select a role'
    if (!values.name.trim()) errs.name = 'Name is required'
    if (!values.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      errs.email = 'Enter a valid email'
    return errs
  }

  function setField<K extends keyof CreateCandidateInput>(key: K, value: CreateCandidateInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function handleNext() {
    const errs = step === 0 ? validateStep1() : {}
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function handleBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  function goTo(idx: number) {
    if (idx <= step) {
      setStep(idx)
      setErrors({})
      return
    }
    if (step === 0) {
      const errs = validateStep1()
      if (Object.keys(errs).length) {
        setErrors(errs)
        return
      }
    }
    setErrors({})
    setStep(idx)
  }

  async function handleSubmit() {
    const errs = step === 0 ? validateStep1() : {}
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    try {
      const result = await createCandidate(values)
      if (cvFile) {
        const { error: uploadErr } = await supabase.storage
          .from('candidate-cvs')
          .upload(`${result.id}.pdf`, cvFile, { upsert: true, contentType: 'application/pdf' })
        if (uploadErr) setCvUploadError(uploadErr.message)
      }
      setCreatedName(result.name)
      setSubmitted(true)
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    }
  }

  function reset() {
    setValues(getInitialValues())
    setStep(0)
    setErrors({})
    setSubmitted(false)
    setCreatedName('')
    setCvFile(null)
    setCvUploadError(null)
  }

  function handleClose() {
    onClose()
    setTimeout(reset, 300)
  }

  const isLast = step === STEPS.length - 1
  const canSubmit = !!values.name.trim() && !!values.email.trim() && values.jobId != null

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      {!submitted ? (
        <>
          {/* Header */}
          <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                  Add candidate
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
                  {step + 1} / {STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center" role="tablist" aria-label="Form steps">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={i === step}
                    onClick={() => goTo(i)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all cursor-pointer',
                      i === step
                        ? 'text-primary'
                        : i < step
                          ? 'text-primary/60 hover:text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                        i === step
                          ? 'bg-primary text-primary-foreground'
                          : i < step
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {i < step ? '✓' : i + 1}
                    </span>
                    {s.label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn('flex-1 h-px mx-1', i < step ? 'bg-primary/25' : 'bg-border')}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {errors.submit && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-destructive/8 border border-destructive/25 text-[12.5px] text-destructive"
              >
                {errors.submit}
              </div>
            )}
            {step === 0 && (
              <StepIdentity
                values={values}
                setField={setField}
                errors={errors}
                duplicateEmail={duplicateEmail}
                cvFile={cvFile}
                onCvChange={setCvFile}
              />
            )}
            {step === 1 && <StepProfile values={values} setField={setField} />}
            {step === 2 && <StepBackground values={values} setField={setField} />}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end px-6 py-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeftIcon className="size-3.5" />
                  Back
                </Button>
              )}
              {!isLast ? (
                <Button size="sm" onClick={handleNext}>
                  Continue
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmit} disabled={!canSubmit} loading={isPending}>
                  Create candidate
                  {!isPending && <ArrowRightIcon className="size-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <SuccessPane
          name={createdName}
          cvUploadError={cvUploadError}
          onClose={handleClose}
          onAddAnother={reset}
        />
      )}
    </Sheet>
  )
}

function SuccessPane({
  name,
  cvUploadError,
  onClose,
  onAddAnother,
}: {
  name: string
  cvUploadError: string | null
  onClose: () => void
  onAddAnother: () => void
}) {
  const firstName = name.split(' ')[0] ?? name
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-[var(--green-bg)] border border-[var(--green-line)] flex items-center justify-center mb-5">
        <CheckCircle2Icon className="size-7 text-[var(--green)]" />
      </div>

      <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground mb-2">
        {firstName} is in the pipeline.
      </h2>
      <p className="text-[13.5px] text-muted-foreground max-w-[340px] mb-8">
        You'll find them on the Cards tab. Open their profile to fill in scores and assign an
        interview slot.
      </p>

      {cvUploadError && (
        <div
          role="alert"
          className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[12.5px] text-amber-800 dark:text-amber-300 mb-4 w-full max-w-[340px] text-left"
        >
          <TriangleAlertIcon className="size-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <span>
            Candidate added, but CV upload failed: {cvUploadError}. You can retry from their
            profile.
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/40 mb-8 w-full max-w-[280px]">
        <div
          className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-semibold shrink-0"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="text-left min-w-0">
          <p className="text-[13.5px] font-medium text-foreground truncate">{name}</p>
          <p className="text-[12px] text-muted-foreground">Added just now</p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <Button variant="outline" size="sm" onClick={onAddAnother}>
          <PlusIcon className="size-3.5" />
          Add another
        </Button>
        <Button size="sm" onClick={onClose}>
          Done
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
