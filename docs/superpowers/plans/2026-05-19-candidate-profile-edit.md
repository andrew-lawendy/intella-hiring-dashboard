# Candidate Profile — Full Visibility & Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose every field from the candidate creation form inside the profile modal, with click-to-edit inline for simple fields and per-section edit forms for complex field groups.

**Architecture:** Three new update hooks (one per DB table). `ProfileOverview` is rewritten to compose three focused section components — `ProfileLogistics`, `ProfileSnapshotSection`, `ProfileBackgroundSection` — each owning its own edit state and mutations. `ProfileModal` gains a one-line change to pass `candidate` down.

**Tech Stack:** React 18, TypeScript, Tanstack Query v5, Supabase JS v2, Tailwind CSS, existing project components (`Input`, `Textarea`, `ChipInput`, `SegmentedToggle`, `ScoreSlider`, `FieldWrapper`, `SectionTitle` from `form-helpers`).

---

## File Map

| File                                                  | Action  | Responsibility                                                                            |
| ----------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `src/hooks/useUpdateCandidate.ts`                     | Create  | PATCH `candidates` table                                                                  |
| `src/hooks/useUpdateCandidateProfile.ts`              | Create  | PATCH `candidate_profiles` table, recomputes `fit_label`                                  |
| `src/hooks/useUpdateCandidateAnalysis.ts`             | Create  | PATCH `candidate_analysis` table                                                          |
| `src/components/profile/ProfileLogistics.tsx`         | Create  | Logistics section: salary, notice, seniority, type, date/time — click-to-edit             |
| `src/components/profile/ProfileSnapshotSection.tsx`   | Create  | Fit score, summary, strengths, watch-for, scores — display + section edit                 |
| `src/components/profile/ProfileBackgroundSection.tsx` | Create  | Education, experience, flags, notable — display (incl. missing fields) + section edit     |
| `src/components/profile/ProfileOverview.tsx`          | Rewrite | Thin composer: `ProfileLogistics` + `ProfileSnapshotSection` + `ProfileBackgroundSection` |
| `src/components/profile/ProfileModal.tsx`             | Modify  | Pass `candidate` to `ProfileOverview`                                                     |

---

### Task 1: `useUpdateCandidate` hook

**Files:**

- Create: `src/hooks/useUpdateCandidate.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/hooks/useUpdateCandidate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type CandidateUpdate = Database['public']['Tables']['candidates']['Update']

export function useUpdateCandidate(candidateId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: CandidateUpdate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidates')
        .update(patch)
        .eq('id', candidateId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate-meta'] })
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUpdateCandidate.ts
git commit -m "feat: add useUpdateCandidate hook"
```

---

### Task 2: `useUpdateCandidateProfile` hook

**Files:**

- Create: `src/hooks/useUpdateCandidateProfile.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/hooks/useUpdateCandidateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fitLabelFromScore } from '@/lib/scoring'
import type { Database } from '@/lib/database.types'

type ProfileUpdate = Database['public']['Tables']['candidate_profiles']['Update']

export function useUpdateCandidateProfile(candidateId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      const update = { ...patch }
      if (update.fit_score != null) {
        update.fit_label = fitLabelFromScore(update.fit_score)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidate_profiles')
        .update(update)
        .eq('candidate_id', candidateId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUpdateCandidateProfile.ts
git commit -m "feat: add useUpdateCandidateProfile hook"
```

---

### Task 3: `useUpdateCandidateAnalysis` hook

**Files:**

- Create: `src/hooks/useUpdateCandidateAnalysis.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/hooks/useUpdateCandidateAnalysis.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AnalysisUpdate = Database['public']['Tables']['candidate_analysis']['Update']

export function useUpdateCandidateAnalysis(candidateId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: AnalysisUpdate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidate_analysis')
        .update(patch)
        .eq('candidate_id', candidateId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUpdateCandidateAnalysis.ts
git commit -m "feat: add useUpdateCandidateAnalysis hook"
```

---

### Task 4: `ProfileLogistics` component

Click-to-edit section at the top of the Overview tab. Contains two sub-components defined in the same file: `InlineTextField` (text/date/time click-to-edit) and `InlineSelectField` (select click-to-edit). Seniority and interview type use `SegmentedToggle` directly — always interactive, saves immediately on change.

`slot` is stored as `YYYY-MM-DDTHH:mm`. Saving date or time independently requires reconstructing both `slot` and related fields (`day` for date, `time` for time).

**Files:**

- Create: `src/components/profile/ProfileLogistics.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/profile/ProfileLogistics.tsx
import { useState, useRef, useEffect } from 'react'
import { PencilIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SegmentedToggle } from '@/components/candidates/form-helpers'
import { useUpdateCandidate } from '@/hooks/useUpdateCandidate'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']

// ─── InlineTextField ────────────────────────────────────────────────────────

interface InlineTextFieldProps {
  label: string
  value: string | null | undefined
  onSave: (v: string) => Promise<void>
  inputType?: 'text' | 'date' | 'time'
  inputClassName?: string
}

function InlineTextField({ label, value, onSave, inputType = 'text', inputClassName }: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value ?? '')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing, value])

  async function commit() {
    const trimmed = draft.trim()
    if (trimmed === (value ?? '')) { setEditing(false); return }
    await onSave(trimmed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setEditing(false)
  }

  function cancel() { setEditing(false); setDraft(value ?? '') }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
          className={cn(
            'h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/50',
            inputClassName,
          )}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1.5 text-[13px] text-left min-h-[24px]"
        >
          <span className={cn(value ? 'text-foreground' : 'text-muted-foreground')}>
            {value || '—'}
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
  const [saved, setSaved] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) setTimeout(() => selectRef.current?.focus(), 0)
  }, [editing])

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await onSave(e.target.value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setEditing(false)
  }

  const displayLabel = options.find((o) => o.value === value)?.label ?? value ?? '—'

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </span>
      {editing ? (
        <select
          ref={selectRef}
          defaultValue={value ?? ''}
          onChange={handleChange}
          onBlur={() => setEditing(false)}
          className="h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1.5 text-[13px] text-left min-h-[24px]"
        >
          <span className={cn(value ? 'text-foreground' : 'text-muted-foreground')}>{displayLabel}</span>
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

function getDayName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(dateStr).getDay()] ?? ''
}

// ─── ProfileLogistics ────────────────────────────────────────────────────────

interface ProfileLogisticsProps {
  candidate: Candidate
}

export function ProfileLogistics({ candidate }: ProfileLogisticsProps) {
  const { mutateAsync: updateCandidate } = useUpdateCandidate(candidate.id)

  const slotDate = candidate.slot ? candidate.slot.split('T')[0] ?? '' : ''
  const slotTime = candidate.time ?? ''

  async function saveDate(newDate: string) {
    const time = slotTime
    const slot = newDate && time ? `${newDate}T${time}` : null
    await updateCandidate({ slot, day: newDate ? getDayName(newDate) : null })
  }

  async function saveTime(newTime: string) {
    const date = slotDate
    const slot = date && newTime ? `${date}T${newTime}` : null
    await updateCandidate({ slot, time: newTime || null })
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
          onSave={saveDate}
          inputType="date"
        />
        <InlineTextField
          label="Interview time"
          value={slotTime || null}
          onSave={saveTime}
          inputType="time"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileLogistics.tsx
git commit -m "feat: add ProfileLogistics section with click-to-edit inline fields"
```

---

### Task 5: `ProfileSnapshotSection` component

Display mode shows fit score, summary, fit breakdown bars, strengths, weaknesses (read-only, AI-generated), and watch-for. A pencil icon on the section header expands an edit form covering all mutable fields. On save, the mutation handles `fit_label` recomputation automatically (via `useUpdateCandidateProfile`).

**Files:**

- Create: `src/components/profile/ProfileSnapshotSection.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={isPending}>
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
              {(profile.strengths ?? []).map((s, i) => (
                <div key={i} className="text-[12.5px] text-[var(--green)] mb-1.5">✓ {s}</div>
              ))}
            </div>
          )}

          {(profile.weaknesses ?? []).length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Weaknesses
              </p>
              {(profile.weaknesses ?? []).map((w, i) => (
                <div key={i} className="text-[12.5px] text-[var(--red)] mb-1.5">⚠ {w}</div>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileSnapshotSection.tsx
git commit -m "feat: add ProfileSnapshotSection with section-level edit"
```

---

### Task 6: `ProfileBackgroundSection` component

Display mode shows the existing education/experience grid plus all previously-missing fields: grad year, master's degree, domains (chip list), experience flags (badge list), and notable. Pencil icon expands a full edit form matching StepBackground fields. `current_role` and `current_company` are derived fields (mirrored from `candidate_profiles` at creation); they are shown read-only here.

**Files:**

- Create: `src/components/profile/ProfileBackgroundSection.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
  checked, onChange, label, id,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
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
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span
        className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all', checked ? 'bg-primary border-primary' : 'border-input')}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}

const EXP_FLAGS: { key: 'ai_exp' | 'b2b' | 'b2c' | 'fintech'; draftKey: 'hasAI' | 'hasB2B' | 'hasB2C' | 'hasFintech'; label: string }[] = [
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
                <Input id="edit-university" value={draft.university} onChange={(e) => setDraft((d) => ({ ...d, university: e.target.value }))} placeholder="e.g. AUC" />
              </FieldWrapper>
              <FieldWrapper label="Degree" optional htmlFor="edit-degree">
                <Input id="edit-degree" value={draft.degree} onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value }))} placeholder="e.g. BSc Computer Science" />
              </FieldWrapper>
              <FieldWrapper label="Graduation year" optional htmlFor="edit-grad-year">
                <Input id="edit-grad-year" value={draft.gradYear} onChange={(e) => setDraft((d) => ({ ...d, gradYear: e.target.value }))} placeholder="2020" inputMode="numeric" />
              </FieldWrapper>
              <FieldWrapper label="Postgraduate" optional htmlFor="edit-masters">
                <CheckItem id="edit-masters" checked={draft.masters} onChange={(v) => setDraft((d) => ({ ...d, masters: v }))} label="Has Master's degree" />
              </FieldWrapper>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SectionTitle>Experience</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Total experience" optional htmlFor="edit-total-exp" hint="Years">
                <Input id="edit-total-exp" value={draft.totalExp} onChange={(e) => setDraft((d) => ({ ...d, totalExp: e.target.value }))} placeholder="e.g. 7" inputMode="decimal" />
              </FieldWrapper>
              <FieldWrapper label="Role-relevant experience" optional htmlFor="edit-pm-exp" hint="Years">
                <Input id="edit-pm-exp" value={draft.pmExp} onChange={(e) => setDraft((d) => ({ ...d, pmExp: e.target.value }))} placeholder="e.g. 4" inputMode="decimal" />
              </FieldWrapper>
            </div>
            <FieldWrapper label="Domains worked in" optional htmlFor="edit-domains" hint="Press Enter to add">
              <ChipInput id="edit-domains" value={draft.domains} onChange={(v) => setDraft((d) => ({ ...d, domains: v }))} placeholder="e.g. FinTech, B2B, Healthcare" />
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
            <FieldWrapper label="Notable" optional htmlFor="edit-notable" hint="Anything else worth flagging">
              <Textarea id="edit-notable" value={draft.notable} onChange={(e) => setDraft((d) => ({ ...d, notable: e.target.value }))} placeholder="e.g. Strong design taste, ex-founder…" rows={3} />
            </FieldWrapper>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={save} loading={isPending}>Save</Button>
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
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">Domains</p>
              <div className="flex flex-wrap gap-1.5">
                {(analysis!.domains!).map((d) => (
                  <span key={d} className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{d}</span>
                ))}
              </div>
            </div>
          )}

          {activeFlags.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">Experience flags</p>
              <div className="flex flex-wrap gap-1.5">
                {activeFlags.map(({ label }) => (
                  <span key={label} className="text-[12px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{label}</span>
                ))}
              </div>
            </div>
          )}

          {analysis?.notable && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">Notable</p>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">{analysis.notable}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileBackgroundSection.tsx
git commit -m "feat: add ProfileBackgroundSection with missing fields and section-level edit"
```

---

### Task 7: Rewrite `ProfileOverview`

Replace the current monolithic read-only component with a thin composer that delegates to the three new sections. The new `candidate` prop is required.

**Files:**

- Modify: `src/components/profile/ProfileOverview.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/components/profile/ProfileOverview.tsx
import type { Database } from '@/lib/database.types'
import { ProfileLogistics } from './ProfileLogistics'
import { ProfileSnapshotSection } from './ProfileSnapshotSection'
import { ProfileBackgroundSection } from './ProfileBackgroundSection'

type Candidate = Database['public']['Tables']['candidates']['Row']
type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

interface ProfileOverviewProps {
  candidate: Candidate
  profile: Profile
  analysis: Analysis | null
}

export function ProfileOverview({ candidate, profile, analysis }: ProfileOverviewProps) {
  return (
    <div>
      <ProfileLogistics candidate={candidate} />
      <div className="px-6">
        <ProfileSnapshotSection profile={profile} />
        <ProfileBackgroundSection analysis={analysis} candidateId={candidate.id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: one error — `ProfileModal.tsx` does not yet pass `candidate` to `ProfileOverview`. Fix that in Task 8.

- [ ] **Step 3: Do not commit yet — wait for Task 8.**

---

### Task 8: Update `ProfileModal` to pass `candidate`

One-line change: add `candidate={candidate}` to the `<ProfileOverview>` call.

**Files:**

- Modify: `src/components/profile/ProfileModal.tsx` (line 165)

- [ ] **Step 1: Edit the file**

Find this line in `ProfileModal.tsx`:

```typescript
{activeTab === 'Overview' && <ProfileOverview profile={profile} analysis={analysis} />}
```

Replace with:

```typescript
{activeTab === 'Overview' && <ProfileOverview candidate={candidate} profile={profile} analysis={analysis} />}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Open the app and verify visually**

1. Navigate to `http://localhost:5173/cards`
2. Click "Open profile →" on any candidate
3. Verify the Overview tab shows:
   - **Logistics section** at the top with salary, notice period, seniority toggle, interview type toggle, date, time
   - **Profile Snapshot section** with fit score, summary, bars, strengths, watch-for
   - **Background section** with the full grid including grad year, master's degree, domains, experience flags, notable
4. Click a salary value — verify it becomes an input, type a new value, press Enter, verify "Saved ✓" flashes
5. Click a seniority toggle button — verify it updates immediately
6. Click the pencil on "Profile Snapshot" — verify the edit form expands; click Cancel — verify it collapses
7. Click the pencil on "Background" — verify the full edit form expands; click Save — verify it saves and collapses

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/ProfileOverview.tsx src/components/profile/ProfileModal.tsx
git commit -m "feat: expose all creation fields in profile modal with inline and section editing"
```
