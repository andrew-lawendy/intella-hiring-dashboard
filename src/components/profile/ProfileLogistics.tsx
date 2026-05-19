// src/components/profile/ProfileLogistics.tsx
import { useState, useRef, useEffect } from 'react'
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SegmentedToggle } from '@/components/candidates/form-helpers'
import { useUpdateCandidate } from '@/hooks/useUpdateCandidate'
import type { Database } from '@/lib/database.types'
import {
  formatInterviewDate,
  formatInterviewTime,
  interviewAtToDateInput,
  interviewAtToTimeInput,
  updateInterviewDate,
  updateInterviewTime,
} from '@/lib/interview'

type Candidate = Database['public']['Tables']['candidates']['Row']

// ─── InlineTextField ────────────────────────────────────────────────────────

interface InlineTextFieldProps {
  label: string
  value: string | null | undefined
  displayValue?: string | null
  onSave: (v: string) => Promise<void>
  inputType?: 'text' | 'date' | 'time'
  inputClassName?: string
}

function InlineTextField({
  label,
  value,
  displayValue,
  onSave,
  inputType = 'text',
  inputClassName,
}: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 0)
  }, [editing])

  async function commit() {
    const trimmed = draft.trim()
    if (trimmed === (value ?? '')) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function cancel() {
    setEditing(false)
    setDraft(value ?? '')
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type={inputType}
            aria-label={label}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
            className={cn(
              'flex-1 h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring/50',
              inputClassName,
            )}
          />
          <button
            type="button"
            onClick={commit}
            disabled={saving}
            aria-label="Save"
            className="p-1 text-[var(--green)] hover:opacity-70 disabled:opacity-40 transition-opacity"
          >
            <CheckIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel"
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value ?? '')
            setEditing(true)
          }}
          className="group flex items-center gap-1.5 text-[13px] text-left min-h-[24px]"
        >
          <span
            className={cn((displayValue ?? value) ? 'text-foreground' : 'text-muted-foreground')}
          >
            {displayValue ?? value ?? '—'}
          </span>
          <PencilIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          {saved && <span className="text-[11px] text-[var(--green)] font-medium">Saved ✓</span>}
        </button>
      )}
    </div>
  )
}

// ─── InlineSelectField ───────────────────────────────────────────────────────

interface InlineSelectFieldProps {
  label: string
  value: string | null | undefined
  options: { value: string; label: string }[]
  onSave: (v: string) => Promise<void>
}

function InlineSelectField({ label, value, options, onSave }: InlineSelectFieldProps) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) setTimeout(() => selectRef.current?.focus(), 0)
  }, [editing])

  async function save() {
    setSaving(true)
    try {
      await onSave(selected)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function cancel() {
    setSelected(value ?? '')
    setEditing(false)
  }

  const displayLabel = options.find((o) => o.value === value)?.label ?? value ?? '—'
  const valueInOptions = options.some((o) => o.value === value)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1">
          <select
            ref={selectRef}
            aria-label={label}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">Select…</option>
            {!valueInOptions && value && <option value={value}>{value}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            aria-label="Save"
            className="p-1 text-[var(--green)] hover:opacity-70 disabled:opacity-40 transition-opacity"
          >
            <CheckIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel"
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setSelected(value ?? '')
            setEditing(true)
          }}
          className="group flex items-center gap-1.5 text-[13px] text-left min-h-[24px]"
        >
          <span className={cn(value ? 'text-foreground' : 'text-muted-foreground')}>
            {displayLabel}
          </span>
          <PencilIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          {saved && <span className="text-[11px] text-[var(--green)] font-medium">Saved ✓</span>}
        </button>
      )}
    </div>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NOTICE_OPTIONS = [
  { value: 'Immediate', label: 'Immediate' },
  { value: '1 week', label: '1 week' },
  { value: '2 weeks', label: '2 weeks' },
  { value: '1 month', label: '1 month' },
  { value: '2 months', label: '2 months' },
  { value: '3 months', label: '3 months' },
  { value: '6 months', label: '6 months' },
]

// ─── ProfileLogistics ────────────────────────────────────────────────────────

interface ProfileLogisticsProps {
  candidate: Candidate
}

export function ProfileLogistics({ candidate }: ProfileLogisticsProps) {
  const { mutateAsync: updateCandidate } = useUpdateCandidate(candidate.id)

  const slotDate = interviewAtToDateInput(candidate.interview_at)
  const slotTime = interviewAtToTimeInput(candidate.interview_at)
  const currentDate = candidate.interview_at ? new Date(candidate.interview_at) : null

  async function saveDate(newDate: string) {
    await updateCandidate({
      interview_at: updateInterviewDate(currentDate, newDate).toISOString(),
    })
  }

  async function saveTime(newTime: string) {
    await updateCandidate({
      interview_at: updateInterviewTime(currentDate, newTime).toISOString(),
    })
  }

  return (
    <div className="px-6 py-5 border-b border-border">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">
        Logistics
      </p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InlineTextField
          label="Salary"
          value={candidate.salary}
          onSave={(v) => updateCandidate({ salary: v || null })}
        />
        <InlineSelectField
          label="Notice period"
          value={candidate.notice}
          options={NOTICE_OPTIONS}
          onSave={(v) => updateCandidate({ notice: v || null })}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Seniority
          </span>
          <SegmentedToggle
            value={candidate.seniority ?? ''}
            onChange={(v) => void updateCandidate({ seniority: v || null })}
            options={[
              { value: 'Intern', label: 'Intern' },
              { value: 'Junior', label: 'Junior' },
              { value: 'Mid', label: 'Mid' },
              { value: 'Senior', label: 'Senior' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Interview type
          </span>
          <SegmentedToggle
            value={candidate.type ?? 'Remote'}
            onChange={(v) => void updateCandidate({ type: v as 'Remote' | 'In-person' })}
            options={[
              { value: 'Remote', label: 'Remote' },
              { value: 'In-person', label: 'In-person' },
            ]}
          />
        </div>
        <InlineTextField
          label="Interview date"
          value={slotDate || null}
          displayValue={formatInterviewDate(candidate.interview_at)}
          onSave={saveDate}
          inputType="date"
        />
        <InlineTextField
          label="Interview time"
          value={slotTime || null}
          displayValue={formatInterviewTime(candidate.interview_at)}
          onSave={saveTime}
          inputType="time"
        />
      </div>
    </div>
  )
}
