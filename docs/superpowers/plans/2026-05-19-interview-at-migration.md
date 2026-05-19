# `interview_at` Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three `candidates` text columns (`slot`, `day`, `time`) with a single `interview_at TIMESTAMPTZ` column, update all consumers, and re-seed with proper UTC ISO timestamps.

**Architecture:** A new `src/lib/interview.ts` utility centralises all formatting and conversion logic so no component handles raw timestamps directly. The DB migration drops the three old columns and adds `interview_at`. The seed data is rewritten with hardcoded UTC strings (Egypt = UTC+2). All display components derive their output from the shared helpers. The frontend sends `new Date(\`${date}T${time}:00+02:00\`).toISOString()` when saving.

**Tech Stack:** PostgreSQL TIMESTAMPTZ, Supabase JS v2, React 18, TypeScript, existing project patterns.

---

## File Map

| File                                               | Action | Responsibility                                                  |
| -------------------------------------------------- | ------ | --------------------------------------------------------------- |
| `supabase/migrations/011_interview_at.sql`         | Create | Drop `slot`/`day`/`time`, add `interview_at TIMESTAMPTZ`        |
| `src/lib/database.types.ts`                        | Modify | Replace the three columns with `interview_at`                   |
| `src/lib/interview.ts`                             | Create | All formatting/conversion helpers for `interview_at`            |
| `src/hooks/useCreateCandidate.ts`                  | Modify | Send `interview_at` ISO string instead of `slot`/`day`/`time`   |
| `src/components/candidates/AddCandidateDrawer.tsx` | Modify | Default value: `interviewAt: ''`                                |
| `src/components/candidates/steps/StepIdentity.tsx` | Modify | Combine date+time inputs → `interviewAt` on change              |
| `src/components/profile/ProfileLogistics.tsx`      | Modify | Derive display/input from `interview_at`; save ISO string       |
| `src/hooks/useCandidateMeta.ts`                    | Modify | Select `interview_at` instead of `slot`/`day`                   |
| `src/hooks/useNotifications.ts`                    | Modify | Pass `interview_at` to `deriveActionItems`                      |
| `src/lib/actionQueue.ts`                           | Modify | Replace `parseSlotDate` + `slot` with `interview_at`            |
| `src/components/cards/CardBody.tsx`                | Modify | Format slot display from `interview_at`                         |
| `src/components/briefing/BriefCard.tsx`            | Modify | Display time from `interview_at`                                |
| `src/components/cards/InterviewTimeline.tsx`       | Modify | Group by date derived from `interview_at`                       |
| `src/pages/BriefingPage.tsx`                       | Modify | Filter/sort by `interview_at`                                   |
| `src/pages/SchedulePage.tsx`                       | Modify | Sort and display using `interview_at`                           |
| `src/lib/compare.ts`                               | Modify | Display slot from `interview_at`                                |
| `src/lib/exports.ts`                               | Modify | Display slot from `interview_at`                                |
| `src/lib/systemPrompt.ts`                          | Modify | Display slot from `interview_at`                                |
| `src/components/cards/ActionQueue.tsx`             | Modify | Pass `interview_at` instead of `slot`                           |
| `supabase/seed/data/candidates.ts`                 | Modify | Replace `slot`/`day`/`time` with `interview_at` UTC ISO strings |

---

### Task 1: SQL migration

**Files:**

- Create: `supabase/migrations/011_interview_at.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/011_interview_at.sql
ALTER TABLE candidates
  ADD COLUMN interview_at timestamptz;

ALTER TABLE candidates
  DROP COLUMN slot,
  DROP COLUMN day,
  DROP COLUMN time;
```

- [ ] **Step 2: Apply to local Supabase**

```bash
npx supabase db push --local
```

Expected: migration applies without error.

- [ ] **Step 3: Verify**

```bash
npx supabase db diff --local
```

Expected: no diff (migration is in sync).

---

### Task 2: Update `database.types.ts`

**Files:**

- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Replace the three columns with `interview_at`**

Find the `candidates` Row type and replace:

```typescript
slot: string | null
day: string | null
time: string | null
```

With:

```typescript
interview_at: string | null
```

The full `candidates` Row type becomes:

```typescript
candidates: {
  Row: {
    id: string
    name: string
    email: string
    interview_at: string | null
    type: 'In-person' | 'Remote' | null
    salary: string | null
    notice: string | null
    seniority: string | null
    job_id: number | null
    created_at: string
  }
  Insert: Omit<Database['public']['Tables']['candidates']['Row'], 'created_at'>
  Update: Partial<Database['public']['Tables']['candidates']['Insert']>
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | head -30
```

Expected: errors only in files that still reference `slot`/`day`/`time` — these will all be fixed in subsequent tasks.

---

### Task 3: Create `src/lib/interview.ts`

All components import from here — no component handles raw timestamps directly.

**Files:**

- Create: `src/lib/interview.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/interview.ts
// All helpers treat stored timestamps as UTC and display in Africa/Cairo (UTC+2, no DST).
const TZ = 'Africa/Cairo'

/** "Sun 17 May" — for logistics display and day-filter labels */
export function formatInterviewDate(interview_at: string | null): string {
  if (!interview_at) return '—'
  return new Date(interview_at).toLocaleDateString('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** "11:00" — start time only */
export function formatInterviewTime(interview_at: string | null): string {
  if (!interview_at) return '—'
  return new Date(interview_at).toLocaleTimeString('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** "Sun 17 May · 11:00" — for cards, schedules, exports */
export function formatInterviewSlot(interview_at: string | null): string {
  if (!interview_at) return 'TBD'
  return `${formatInterviewDate(interview_at)} · ${formatInterviewTime(interview_at)}`
}

/** "Sunday 17 May" — matches the hardcoded DAYS labels used in BriefingPage and InterviewTimeline */
export function formatInterviewDayLabel(interview_at: string | null): string {
  if (!interview_at) return ''
  return new Date(interview_at).toLocaleDateString('en-GB', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** YYYY-MM-DD in Cairo time — for <input type="date"> value */
export function interviewAtToDateInput(interview_at: string | null): string {
  if (!interview_at) return ''
  return new Date(interview_at).toLocaleDateString('en-CA', { timeZone: TZ })
}

/** HH:mm in Cairo time — for <input type="time"> value */
export function interviewAtToTimeInput(interview_at: string | null): string {
  if (!interview_at) return ''
  return new Date(interview_at).toLocaleTimeString('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Combine a YYYY-MM-DD date input and HH:mm time input (both in Cairo time)
 * into a UTC ISO string suitable for storing as TIMESTAMPTZ.
 */
export function toInterviewAt(dateInput: string, timeInput: string): string | null {
  if (!dateInput || !timeInput) return null
  return new Date(`${dateInput}T${timeInput}:00+02:00`).toISOString()
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "interview.ts"
```

Expected: no errors in this file.

---

### Task 4: Update `useCreateCandidate.ts`

**Files:**

- Modify: `src/hooks/useCreateCandidate.ts`

- [ ] **Step 1: Update `CreateCandidateInput` — replace `slotDate`/`slotTime` with `interviewAt`**

Replace:

```typescript
slotDate: string
slotTime: string
```

With:

```typescript
interviewAt: string
```

- [ ] **Step 2: Update the mutation — remove `getDayName`, send `interview_at`**

Remove the `getDayName` function entirely. Replace the `slot`/`day`/`time` fields in the insert:

```typescript
import { toInterviewAt } from '@/lib/interview'
```

And in the `insert` call, replace:

```typescript
const slot = data.slotDate && data.slotTime ? `${data.slotDate}T${data.slotTime}` : null
// ...
slot,
day: data.slotDate ? getDayName(data.slotDate) : null,
time: data.slotTime || null,
```

With:

```typescript
interview_at: data.interviewAt || null,
```

- [ ] **Step 3: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "useCreateCandidate"
```

Expected: no errors in this file (errors will be in the form components that still use `slotDate`/`slotTime`).

---

### Task 5: Update `AddCandidateDrawer.tsx` and `StepIdentity.tsx`

**Files:**

- Modify: `src/components/candidates/AddCandidateDrawer.tsx`
- Modify: `src/components/candidates/steps/StepIdentity.tsx`

- [ ] **Step 1: Update default values in `AddCandidateDrawer.tsx`**

Replace:

```typescript
slotDate: '',
slotTime: '',
```

With:

```typescript
interviewAt: '',
```

- [ ] **Step 2: Update `StepIdentity.tsx` — combine date+time into `interviewAt`**

The form keeps two separate inputs (date picker + time picker) for UX, but combines them on change using `toInterviewAt`.

Add import at top:

```typescript
import { toInterviewAt, interviewAtToDateInput, interviewAtToTimeInput } from '@/lib/interview'
```

Replace the date and time field blocks:

```tsx
<div className="grid grid-cols-2 gap-4">
  <FieldWrapper label="Interview date" optional htmlFor="field-slot-date">
    <Input
      id="field-slot-date"
      type="date"
      value={interviewAtToDateInput(values.interviewAt)}
      onChange={(e) => {
        const time = interviewAtToTimeInput(values.interviewAt)
        setField('interviewAt', toInterviewAt(e.target.value, time) ?? '')
      }}
    />
  </FieldWrapper>

  <FieldWrapper label="Interview time" optional htmlFor="field-slot-time">
    <Input
      id="field-slot-time"
      type="time"
      value={interviewAtToTimeInput(values.interviewAt)}
      onChange={(e) => {
        const date = interviewAtToDateInput(values.interviewAt)
        setField('interviewAt', toInterviewAt(date, e.target.value) ?? '')
      }}
    />
  </FieldWrapper>
</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep -E "AddCandidateDrawer|StepIdentity"
```

Expected: no errors in these files.

---

### Task 6: Update `ProfileLogistics.tsx`

**Files:**

- Modify: `src/components/profile/ProfileLogistics.tsx`

- [ ] **Step 1: Replace slot/time derivation with interview_at helpers**

Add import:

```typescript
import {
  formatInterviewDate,
  formatInterviewTime,
  interviewAtToDateInput,
  interviewAtToTimeInput,
  toInterviewAt,
} from '@/lib/interview'
```

Replace the `slotDate`/`slotTime` block and the `saveDate`/`saveTime` functions:

```typescript
const slotDate = interviewAtToDateInput(candidate.interview_at)
const slotTime = interviewAtToTimeInput(candidate.interview_at)

async function saveDate(newDate: string) {
  await updateCandidate({
    interview_at: toInterviewAt(newDate, slotTime),
  })
}

async function saveTime(newTime: string) {
  await updateCandidate({
    interview_at: toInterviewAt(slotDate, newTime),
  })
}
```

Remove the `getDayName` function and the `MONTH_MAP` constant (no longer needed here).

Update display values for the date/time fields to use formatted strings:

```tsx
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
```

This requires the `displayValue` prop to be re-added to `InlineTextField` (it was removed in an earlier revert). Add it back:

```typescript
interface InlineTextFieldProps {
  label: string
  value: string | null | undefined
  displayValue?: string | null
  onSave: (v: string) => Promise<void>
  inputType?: 'text' | 'date' | 'time'
  inputClassName?: string
}
```

And in the display span:

```tsx
<span className={cn((displayValue ?? value) ? 'text-foreground' : 'text-muted-foreground')}>
  {displayValue ?? value ?? '—'}
</span>
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "ProfileLogistics"
```

Expected: no errors.

---

### Task 7: Update `useCandidateMeta.ts`, `useNotifications.ts`, and `actionQueue.ts`

**Files:**

- Modify: `src/hooks/useCandidateMeta.ts`
- Modify: `src/hooks/useNotifications.ts`
- Modify: `src/lib/actionQueue.ts`

- [ ] **Step 1: Update `useCandidateMeta.ts` — select `interview_at`**

Find the type pick. Replace `'slot' | 'day'` with `'interview_at'`:

```typescript
;'id' | 'interview_at' | 'name' | 'email' | 'seniority' | 'job_id'
```

- [ ] **Step 2: Update `actionQueue.ts` — replace `slot`-based logic with `interview_at`**

Replace the entire `parseSlotDate` function and `MONTHS` constant with a direct Date parse:

```typescript
function getInterviewDate(interview_at: string | null): Date | null {
  if (!interview_at) return null
  const d = new Date(interview_at)
  return isNaN(d.getTime()) ? null : d
}
```

Update the `CandidateMini` type (or wherever `slot` is typed):

```typescript
interface CandidateMini {
  id: string
  name: string
  interview_at: string | null
  jobId: number
}
```

Replace all `c.slot` references with `c.interview_at` and `parseSlotDate(c.slot)` with `getInterviewDate(c.interview_at)`.

The "no slot assigned" check changes from:

```typescript
if (!c.slot || c.slot === 'TBD' || slotDate === null) {
```

To:

```typescript
if (!c.interview_at || interviewDate === null) {
```

- [ ] **Step 3: Update `useNotifications.ts` — pass `interview_at`**

Replace the `.map()` that builds the candidate list:

```typescript
.map((c) => ({
  id: c.id,
  name: c.name,
  interview_at: c.interview_at,
  jobId: c.job_id as number,
})),
```

- [ ] **Step 4: Update `ActionQueue.tsx` — pass `interview_at`**

In `src/components/cards/ActionQueue.tsx`, find the `.map()` that picks `slot` and replace with `interview_at`:

```typescript
.map((c) => ({ id: c.id, name: c.name, interview_at: c.interview_at, jobId: c.job_id as number })),
```

- [ ] **Step 5: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep -E "useCandidateMeta|useNotifications|actionQueue|ActionQueue"
```

Expected: no errors in these files.

---

### Task 8: Update card and briefing display components

**Files:**

- Modify: `src/components/cards/CardBody.tsx`
- Modify: `src/components/briefing/BriefCard.tsx`
- Modify: `src/components/cards/InterviewTimeline.tsx`

- [ ] **Step 1: Update `CardBody.tsx`**

Add import:

```typescript
import { formatInterviewSlot } from '@/lib/interview'
```

Replace:

```typescript
{ label: 'Interview Slot', value: candidate.slot },
```

With:

```typescript
{ label: 'Interview Slot', value: formatInterviewSlot(candidate.interview_at) },
```

- [ ] **Step 2: Update `BriefCard.tsx`**

Add import:

```typescript
import { formatInterviewTime } from '@/lib/interview'
```

Replace:

```tsx
{
  candidate.time
}
```

With:

```tsx
{
  formatInterviewTime(candidate.interview_at)
}
```

Replace:

```typescript
{ label: 'Slot', value: candidate.slot },
```

With:

```typescript
{ label: 'Slot', value: formatInterviewSlot(candidate.interview_at) },
```

- [ ] **Step 3: Update `InterviewTimeline.tsx`**

Add import:

```typescript
import { formatInterviewDayLabel } from '@/lib/interview'
```

Update the `CandidateDay` interface:

```typescript
interface CandidateDay {
  id: string
  interview_at: string | null
}
```

Replace the `counts` and `confirmedCounts` maps (which use `c.day === day`) with:

```typescript
const counts = DAYS.map(
  (day) => candidates.filter((c) => formatInterviewDayLabel(c.interview_at) === day).length,
)
const confirmedCounts = DAYS.map(
  (day) =>
    candidates.filter(
      (c) => formatInterviewDayLabel(c.interview_at) === day && stateMap[c.id]?.confirmed === true,
    ).length,
)
```

Also update `getTodayLabel` — it currently checks `candidate.day` values. Since it only looks at today's date (not the candidate data), it stays the same. No change needed there.

- [ ] **Step 4: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep -E "CardBody|BriefCard|InterviewTimeline"
```

Expected: no errors.

---

### Task 9: Update remaining consumers

**Files:**

- Modify: `src/pages/BriefingPage.tsx`
- Modify: `src/pages/SchedulePage.tsx`
- Modify: `src/lib/compare.ts`
- Modify: `src/lib/exports.ts`
- Modify: `src/lib/systemPrompt.ts`

- [ ] **Step 1: Update `BriefingPage.tsx`**

Add import:

```typescript
import { formatInterviewDayLabel, formatInterviewSlot } from '@/lib/interview'
```

Replace the filter and sort:

```typescript
const filtered = data
  .filter((d) => day === 'All' || formatInterviewDayLabel(d.candidate.interview_at) === day)
  .sort((a, b) => (a.candidate.interview_at ?? '').localeCompare(b.candidate.interview_at ?? ''))
```

- [ ] **Step 2: Update `SchedulePage.tsx`**

Add import:

```typescript
import { formatInterviewSlot } from '@/lib/interview'
```

Replace the sort comparator:

```typescript
if (!a.interview_at) return 1
if (!b.interview_at) return -1
return a.interview_at.localeCompare(b.interview_at)
```

Replace the slot column cell renderer:

```tsx
{
  formatInterviewSlot(row.original.candidate.interview_at)
}
```

- [ ] **Step 3: Update `compare.ts`**

Add import:

```typescript
import { formatInterviewSlot } from '@/lib/interview'
```

Replace:

```typescript
{ label: 'Slot', a: candidateA.slot ?? '—', b: candidateB.slot ?? '—' },
```

With:

```typescript
{ label: 'Slot', a: formatInterviewSlot(candidateA.interview_at), b: formatInterviewSlot(candidateB.interview_at) },
```

- [ ] **Step 4: Update `exports.ts`**

Add import:

```typescript
import { formatInterviewSlot } from '@/lib/interview'
```

Replace both occurrences of `candidate.slot`:

```typescript
// In the Excel export row:
Slot: formatInterviewSlot(candidate.interview_at),
// In the HTML template:
<span>📅 ${formatInterviewSlot(candidate.interview_at)}</span>
```

- [ ] **Step 5: Update `systemPrompt.ts`**

Add import:

```typescript
import { formatInterviewSlot } from '@/lib/interview'
```

Replace:

```typescript
;`- Slot: ${candidate.slot} | ...`
```

With:

```typescript
;`- Slot: ${formatInterviewSlot(candidate.interview_at)} | ...`
```

- [ ] **Step 6: Full TypeScript check**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors.

---

### Task 10: Re-seed candidates data

**Files:**

- Modify: `supabase/seed/data/candidates.ts`

All times are Cairo local (UTC+2). UTC = Cairo − 2 hours.

- [ ] **Step 1: Replace `slot`/`day`/`time` with `interview_at` in every candidate**

The full updated `candidatesData` export (replace the entire file content from the array onwards):

```typescript
// Egypt is UTC+2 year-round (no DST since 2011). All timestamps stored in UTC.
export const candidatesData = [
  {
    id: '33a8df59-fad2-46ba-9dd4-1159d37633ce',
    name: 'Mina Taallap Shawkei',
    email: 'minataallap@gmail.com',
    interview_at: '2026-05-17T09:00:00.000Z', // 11:00 Cairo
    type: 'In-person' as const,
    salary: '85K-100K EGP',
    notice: '30 days',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '52b2ffb0-bbe8-48a2-b948-fa6915aefc3e',
    name: 'Lamia Mostafa',
    email: 'lamiamostafa2@gmail.com',
    interview_at: '2026-05-17T10:00:00.000Z', // 12:00 Cairo
    type: 'In-person' as const,
    salary: '60,000 EGP',
    notice: '30 days',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '80df0280-6067-4af7-8374-623b897269ac',
    name: 'Malak Abdelghaffar',
    email: 'malak.yabdelghaffar@gmail.com',
    interview_at: '2026-05-17T11:00:00.000Z', // 13:00 Cairo
    type: 'In-person' as const,
    salary: '~$3,000/month',
    notice: 'End of June',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: 'c5f0649b-ae7d-4189-9ac2-451da7a27640',
    name: 'Marwan Elwan',
    email: '40marwan@gmail.com',
    interview_at: '2026-05-17T14:00:00.000Z', // 16:00 Cairo
    type: 'Remote' as const,
    salary: '$3,000-$3,200/month',
    notice: '30 days',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: 'f0bad8e6-b9c9-401e-962b-3c7b510c7eba',
    name: 'Kareem Ragab',
    email: 'Kareem.khaled@hotmail.com',
    interview_at: '2026-05-18T09:00:00.000Z', // 11:00 Cairo
    type: 'In-person' as const,
    salary: '125K-150K EGP',
    notice: 'Immediate',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '11c92454-b196-4403-8977-fd1f3ef58fc7',
    name: 'Mohamed Adel Eltabakh',
    email: 'M.eltabakh@outlook.com',
    interview_at: '2026-05-18T14:00:00.000Z', // 16:00 Cairo
    type: 'In-person' as const,
    salary: '85K-100K EGP',
    notice: 'Immediate',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: 'c45614dc-cf9c-441d-bdd8-492c056ec7a4',
    name: 'Moaaz Tarek',
    email: 'moaaztarek4@gmail.com',
    interview_at: '2026-05-18T15:00:00.000Z', // 17:00 Cairo
    type: 'In-person' as const,
    salary: '~85,000 EGP',
    notice: 'Immediate',
    seniority: 'Mid',
    job_id: 1,
  },
  {
    id: '15108b7b-92a1-473c-9523-f254aba0d601',
    name: 'Hadeer Mohamed Saeed',
    email: 'Hadeer_m7md@hotmail.com',
    interview_at: '2026-05-19T10:00:00.000Z', // 12:00 Cairo
    type: 'In-person' as const,
    salary: '90K-110K EGP',
    notice: '1 month',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '52a66cfb-3676-4b1e-8211-783073eda7f4',
    name: 'Eman Wed Abdullah',
    email: 'emanwed@gmail.com',
    interview_at: '2026-05-19T13:00:00.000Z', // 15:00 Cairo
    type: 'In-person' as const,
    salary: '$3,200/month',
    notice: '2 weeks',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '99202fe6-df86-4180-b311-ec318c7b4af9',
    name: 'Aliaa Magdy Elfeky',
    email: 'aliaaelfeki@gmail.com',
    interview_at: '2026-05-19T14:00:00.000Z', // 16:00 Cairo
    type: 'In-person' as const,
    salary: 'TBD',
    notice: 'TBD',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '5682b4c5-5088-48a2-8df2-479105a0d0ed',
    name: 'Loay Hamdy Omar',
    email: 'loayhamdy96@gmail.com',
    interview_at: '2026-05-19T15:00:00.000Z', // 17:00 Cairo
    type: 'In-person' as const,
    salary: '85K-90K EGP',
    notice: '3-4 weeks',
    seniority: 'Mid',
    job_id: 1,
  },
  {
    id: 'ebba70a1-0b61-4168-b224-3e25f3bb7896',
    name: 'Zainab Gehad Talaat',
    email: 'zainabgehad@gmail.com',
    interview_at: '2026-05-19T16:00:00.000Z', // 18:00 Cairo
    type: 'In-person' as const,
    salary: '$1,850-$2,000/month',
    notice: '1 month',
    seniority: 'Junior',
    job_id: 1,
  },
  {
    id: 'cdab4ae9-70d8-44ab-b2e3-593bdec838ba',
    name: 'Amr Mekawy',
    email: 'amekawy@aucegypt.edu',
    interview_at: '2026-05-20T09:00:00.000Z', // 11:00 Cairo
    type: 'In-person' as const,
    salary: '150,000 EGP',
    notice: '1 month max',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '508616a2-3a8f-441c-8791-5bbe18cfac15',
    name: 'Abdulrahman Nasser',
    email: 'abdelrahmannasserr@gmail.com',
    interview_at: '2026-05-20T10:00:00.000Z', // 12:00 Cairo
    type: 'In-person' as const,
    salary: 'TBD',
    notice: 'Immediate',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: '323d10e2-e78c-4efc-9441-c5dbd087c70b',
    name: 'Mostafa El Toukhy',
    email: 'Toukhy.mostafa@gmail.com',
    interview_at: '2026-05-20T14:00:00.000Z', // 16:00 Cairo
    type: 'In-person' as const,
    salary: 'TBD',
    notice: '2 months',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: 'c45b75f0-5314-4612-8946-6ae6288bd81b',
    name: 'Bavly Ossam',
    email: 'bavlyossam@gmail.com',
    interview_at: '2026-05-20T15:00:00.000Z', // 17:00 Cairo
    type: 'In-person' as const,
    salary: '70,000 EGP',
    notice: 'TBD',
    seniority: 'Junior',
    job_id: 1,
  },
  {
    id: '8107e372-9ab9-467b-b6dc-55e4c25d0bae',
    name: 'Nada Ahmed Abdel Kader',
    email: 'nadaahmeda8@gmail.com',
    interview_at: '2026-05-21T12:00:00.000Z', // 14:00 Cairo
    type: 'In-person' as const,
    salary: '115K-125K EGP',
    notice: '30 days',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: 'e8dd37a4-588f-494a-8939-0dd91f29809b',
    name: 'Mostafa Mahmoud',
    email: 'Mostafa.atallah1998@gmail.com',
    interview_at: '2026-05-21T13:00:00.000Z', // 15:00 Cairo
    type: 'In-person' as const,
    salary: 'TBD',
    notice: '1 month',
    seniority: 'Mid',
    job_id: 1,
  },
  {
    id: '6e639434-7637-4b78-b44a-eb056a26260d',
    name: 'Omar Maged Youssef',
    email: 'omarxyoussef@gmail.com',
    interview_at: '2026-05-21T14:00:00.000Z', // 16:00 Cairo
    type: 'In-person' as const,
    salary: '115,000 EGP',
    notice: '1 month',
    seniority: 'Senior',
    job_id: 1,
  },
  {
    id: 'ccba2e81-1cdd-4a2e-97d5-40757e529792',
    name: 'George Fekry',
    email: 'georgefekry07@gmail.com',
    interview_at: null,
    type: 'In-person' as const,
    salary: '94,000 EGP',
    notice: '45 days',
    seniority: 'Mid',
    job_id: 1,
  },
]

export const initialConfirmed: Record<string, boolean> = {
  '33a8df59-fad2-46ba-9dd4-1159d37633ce': true,
  '52b2ffb0-bbe8-48a2-b948-fa6915aefc3e': true,
  '80df0280-6067-4af7-8374-623b897269ac': true,
  'c5f0649b-ae7d-4189-9ac2-451da7a27640': true,
  'f0bad8e6-b9c9-401e-962b-3c7b510c7eba': true,
  '11c92454-b196-4403-8977-fd1f3ef58fc7': true,
  'c45614dc-cf9c-441d-bdd8-492c056ec7a4': true,
  '15108b7b-92a1-473c-9523-f254aba0d601': true,
  '52a66cfb-3676-4b1e-8211-783073eda7f4': true,
  '99202fe6-df86-4180-b311-ec318c7b4af9': false,
  '5682b4c5-5088-48a2-8df2-479105a0d0ed': true,
  'ebba70a1-0b61-4168-b224-3e25f3bb7896': true,
  'cdab4ae9-70d8-44ab-b2e3-593bdec838ba': true,
  '508616a2-3a8f-441c-8791-5bbe18cfac15': true,
  '323d10e2-e78c-4efc-9441-c5dbd087c70b': true,
  'c45b75f0-5314-4612-8946-6ae6288bd81b': true,
  '8107e372-9ab9-467b-b6dc-55e4c25d0bae': true,
  'e8dd37a4-588f-494a-8939-0dd91f29809b': true,
  '6e639434-7637-4b78-b44a-eb056a26260d': true,
  'ccba2e81-1cdd-4a2e-97d5-40757e529792': false,
}
```

Note: `job_id` and `seniority` are included because the current seed file may or may not have them — include them to ensure the data is complete. Cross-check the current `candidatesData` for any fields not listed above and carry them over.

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors across the entire project.

---

### Task 11: Apply migration and re-seed

- [ ] **Step 1: Apply the migration to local Supabase**

```bash
npx supabase db push --local
```

Expected: `011_interview_at.sql` applied, success message.

- [ ] **Step 2: Re-seed**

```bash
yarn ts-node -e "require('./supabase/seed/index.ts')" 2>&1
```

Or if using the project's seed command:

```bash
cd supabase/seed && npx tsx index.ts
```

Expected: `Seed complete.`

- [ ] **Step 3: Verify in the browser**

1. Open `http://localhost:5173/cards`
2. Confirm candidate cards show Interview Slot as e.g. "Sun 17 May · 11:00" (not the old "Sun 17 May 11:00-12:00")
3. Open any candidate profile → Overview tab → click Interview Date → input pre-fills with "05/17/2026"
4. Click Interview Time → input pre-fills with "11:00"
5. Open Day Briefing → confirm day filter buttons work and candidates appear under correct days
6. Open Schedule tab → confirm candidates are sorted by time

---

## Self-Review

**Spec coverage:**

- ✅ Drop `slot`/`day`/`time` — Task 1
- ✅ Add `interview_at TIMESTAMPTZ` — Task 1
- ✅ Update DB types — Task 2
- ✅ Centralised formatting utility — Task 3
- ✅ `useCreateCandidate` sends ISO string — Task 4
- ✅ Form keeps date+time pickers, combines to ISO — Task 5
- ✅ `ProfileLogistics` pre-fills edit inputs correctly — Task 6
- ✅ `actionQueue` / notifications updated — Task 7
- ✅ All display components updated — Tasks 8 + 9
- ✅ Re-seed with UTC ISO strings — Task 10
- ✅ Migration applied and verified — Task 11

**Placeholder scan:** None found.

**Type consistency:** `interview_at: string | null` used consistently. `toInterviewAt` returns `string | null`. All display helpers accept `string | null`. `CandidateMini` in `actionQueue.ts` uses `interview_at`. `CandidateDay` in `InterviewTimeline.tsx` uses `interview_at`.
