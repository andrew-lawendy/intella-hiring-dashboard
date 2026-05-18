# Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `AlertBanners` with a dynamic bell-icon notification system in the header, visible on every page, with actionable items that navigate to the candidate profile.

**Architecture:** Extend `actionQueue.ts` with time-aware rules and a shared `TYPE_COLORS` map. A new `useNotifications` hook derives all items globally (no job filter). A new `NotificationBell` component in the header shows a count badge and opens a Popover dropdown; clicking a row navigates to `/cards?job=<slug>&profile=<id>`. `AlertBanners` is deleted. `ActionQueue` on Cards is kept as a job-filtered contextual view.

**Tech Stack:** React 19, TypeScript, Radix UI (`radix-ui` monolithic package), React Router v6, TanStack Query v5, Vitest

---

## File Map

| File                                         | Action | Responsibility                                                             |
| -------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `src/lib/actionQueue.ts`                     | Modify | Add types, `parseSlotDate`, new rules, sort, export `TYPE_COLORS`          |
| `src/lib/__tests__/actionQueue.test.ts`      | Create | Unit tests for `parseSlotDate` and `deriveActionItems`                     |
| `src/hooks/useCandidateMeta.ts`              | Modify | Add `job_id` to `CandidateMeta` and query select                           |
| `src/components/ui/popover.tsx`              | Create | Radix Popover wrapper (same pattern as `select.tsx`)                       |
| `src/hooks/useNotifications.ts`              | Create | Global notification derivation hook                                        |
| `src/components/layout/NotificationBell.tsx` | Create | Bell icon + Popover dropdown in header                                     |
| `src/components/layout/Header.tsx`           | Modify | Add `<NotificationBell />` between job selector and "+ Add candidate"      |
| `src/components/layout/AlertBanners.tsx`     | Delete | Replaced by dynamic system                                                 |
| `src/components/layout/Layout.tsx`           | Modify | Remove `<AlertBanners />`                                                  |
| `src/components/cards/ActionQueue.tsx`       | Modify | Import `TYPE_COLORS` from `actionQueue.ts`; add `jobId` to `CandidateSlot` |

---

## Task 1: Extend actionQueue.ts

**Files:**

- Modify: `src/lib/actionQueue.ts`
- Create: `src/lib/__tests__/actionQueue.test.ts`

- [ ] **Step 1: Write failing tests for `parseSlotDate`**

Create `src/lib/__tests__/actionQueue.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseSlotDate, deriveActionItems } from '../actionQueue'

describe('parseSlotDate', () => {
  it('returns null for null input', () => {
    expect(parseSlotDate(null)).toBeNull()
  })

  it('returns null for TBD', () => {
    expect(parseSlotDate('TBD')).toBeNull()
  })

  it('returns null for unparseable string', () => {
    expect(parseSlotDate('not a date')).toBeNull()
  })

  it('parses a valid slot string', () => {
    const result = parseSlotDate('Sun 17 May 11:00-12:00')
    expect(result).not.toBeNull()
    expect(result!.getMonth()).toBe(4) // May = 4
    expect(result!.getDate()).toBe(17)
    expect(result!.getHours()).toBe(11)
    expect(result!.getMinutes()).toBe(0)
  })
})

describe('deriveActionItems', () => {
  const TODAY = new Date(2026, 4, 18, 10, 0) // Mon 18 May 2026 10:00
  const TOMORROW = new Date(2026, 4, 19, 10, 0)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const baseState = {
    confirmed: false,
    interview_status: 'pending' as const,
    verdict: null,
  }

  it('emits slot-today-unconfirmed when slot is today and not confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Mon 18 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-today-unconfirmed')).toBe(true)
  })

  it('does not emit slot-today-unconfirmed when already confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Mon 18 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: true } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-today-unconfirmed')).toBe(false)
  })

  it('emits slot-tomorrow-unconfirmed when slot is tomorrow and not confirmed', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Tue 19 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'slot-tomorrow-unconfirmed')).toBe(true)
  })

  it('emits no-slot when slot is null', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: null, jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('emits no-slot when slot is TBD', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'TBD', jobId: 2 }],
      { c1: baseState },
      {},
    )
    expect(items.some((i) => i.type === 'no-slot')).toBe(true)
  })

  it('emits unconfirmed for future slots beyond tomorrow', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: 'Wed 20 May 14:00-15:00', jobId: 2 }],
      { c1: { ...baseState, confirmed: false } },
      {},
    )
    expect(items.some((i) => i.type === 'unconfirmed')).toBe(true)
  })

  it('sorts red items before amber before blue', () => {
    const items = deriveActionItems(
      [
        { id: 'c1', name: 'Alice', slot: 'Mon 18 May 14:00-15:00', jobId: 2 },
        { id: 'c2', name: 'Bob', slot: null, jobId: 2 },
        { id: 'c3', name: 'Carol', slot: 'TBD', jobId: 2 },
      ],
      {
        c1: { confirmed: false, interview_status: 'completed', verdict: null },
        c2: { confirmed: false, interview_status: 'pending', verdict: null },
        c3: { confirmed: false, interview_status: 'completed', verdict: null },
      },
      {},
    )
    const urgencies = items.map((i) =>
      ['slot-today-unconfirmed', 'overdue-scorecard'].includes(i.type)
        ? 0
        : ['no-slot', 'slot-tomorrow-unconfirmed', 'unconfirmed'].includes(i.type)
          ? 1
          : 2,
    )
    for (let i = 1; i < urgencies.length; i++) {
      expect(urgencies[i]).toBeGreaterThanOrEqual(urgencies[i - 1])
    }
  })

  it('carries jobId through to each ActionItem', () => {
    const items = deriveActionItems(
      [{ id: 'c1', name: 'Alice', slot: null, jobId: 7 }],
      { c1: baseState },
      {},
    )
    expect(items[0].jobId).toBe(7)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn vitest run src/lib/__tests__/actionQueue.test.ts
```

Expected: multiple failures — `parseSlotDate` and new types not exported yet.

- [ ] **Step 3: Rewrite `src/lib/actionQueue.ts`**

```ts
export type ActionItemType =
  | 'no-slot'
  | 'slot-today-unconfirmed'
  | 'slot-tomorrow-unconfirmed'
  | 'unconfirmed'
  | 'no-verdict'
  | 'overdue-scorecard'

export interface ActionItem {
  type: ActionItemType
  candidateId: string
  candidateName: string
  jobId: number
  message: string
}

export const TYPE_COLORS: Record<ActionItemType, string> = {
  'slot-today-unconfirmed': 'var(--red)',
  'overdue-scorecard': 'var(--red)',
  'no-slot': 'var(--amber)',
  'slot-tomorrow-unconfirmed': 'var(--amber)',
  unconfirmed: 'var(--amber)',
  'no-verdict': 'var(--blue)',
}

const URGENCY: Record<ActionItemType, number> = {
  'slot-today-unconfirmed': 0,
  'overdue-scorecard': 0,
  'no-slot': 1,
  'slot-tomorrow-unconfirmed': 1,
  unconfirmed: 1,
  'no-verdict': 2,
}

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

export function parseSlotDate(slot: string | null): Date | null {
  if (!slot || slot === 'TBD') return null
  const match = slot.match(/\w+ (\d+) (\w+) (\d+):(\d+)/)
  if (!match) return null
  const [, day, month, hour, minute] = match
  const monthIndex = MONTHS[month]
  if (monthIndex === undefined) return null
  return new Date(
    new Date().getFullYear(),
    monthIndex,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
  )
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface CandidateMin {
  id: string
  name: string
  slot: string | null
  jobId: number
}

interface StateMin {
  confirmed: boolean
  interview_status: string
  verdict: string | null
}

export function deriveActionItems(
  candidates: CandidateMin[],
  stateMap: Record<string, StateMin>,
  myScoresMap: Record<string, Record<string, number>>,
): ActionItem[] {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const items: ActionItem[] = []

  for (const c of candidates) {
    const s = stateMap[c.id]
    if (!s) continue

    const slotDate = parseSlotDate(c.slot)

    if (!c.slot || c.slot === 'TBD') {
      items.push({
        type: 'no-slot',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'No slot assigned',
      })
    } else if (slotDate && isSameDay(slotDate, now) && !s.confirmed) {
      items.push({
        type: 'slot-today-unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview today — not confirmed',
      })
    } else if (slotDate && isSameDay(slotDate, tomorrow) && !s.confirmed) {
      items.push({
        type: 'slot-tomorrow-unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview tomorrow — not confirmed',
      })
    } else if (!s.confirmed && c.slot && c.slot !== 'TBD') {
      items.push({
        type: 'unconfirmed',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Confirmation pending',
      })
    }

    if (s.interview_status === 'completed' && s.verdict === null) {
      items.push({
        type: 'no-verdict',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Interview done — no verdict set',
      })
    }

    const myScores = myScoresMap[c.id] ?? {}
    const hasScored = Object.values(myScores).some((v) => v > 0)
    if (s.interview_status === 'completed' && !hasScored) {
      items.push({
        type: 'overdue-scorecard',
        candidateId: c.id,
        candidateName: c.name,
        jobId: c.jobId,
        message: 'Scorecard overdue',
      })
    }
  }

  return items.sort((a, b) => URGENCY[a.type] - URGENCY[b.type])
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn vitest run src/lib/__tests__/actionQueue.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actionQueue.ts src/lib/__tests__/actionQueue.test.ts
git commit -m "feat(notifications): extend action queue with time-aware rules and TYPE_COLORS"
```

---

## Task 2: Add `job_id` to CandidateMeta

**Files:**

- Modify: `src/hooks/useCandidateMeta.ts`

- [ ] **Step 1: Update the type and query**

In `src/hooks/useCandidateMeta.ts`, change:

```ts
export type CandidateMeta = Pick<Candidate, 'id' | 'day' | 'name' | 'email' | 'slot' | 'seniority'>
```

to:

```ts
export type CandidateMeta = Pick<
  Candidate,
  'id' | 'day' | 'name' | 'email' | 'slot' | 'seniority' | 'job_id'
>
```

And change the select string:

```ts
.select('id, day, name, email, slot, seniority')
```

to:

```ts
.select('id, day, name, email, slot, seniority, job_id')
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCandidateMeta.ts
git commit -m "feat(notifications): add job_id to CandidateMeta"
```

---

## Task 3: Create Popover UI component

**Files:**

- Create: `src/components/ui/popover.tsx`

- [ ] **Step 1: Create `src/components/ui/popover.tsx`**

```tsx
import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-[200] w-72 rounded-md border bg-popover text-popover-foreground shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/popover.tsx
git commit -m "feat(ui): add Popover component"
```

---

## Task 4: Create `useNotifications` hook

**Files:**

- Create: `src/hooks/useNotifications.ts`

- [ ] **Step 1: Create `src/hooks/useNotifications.ts`**

```ts
import { useMemo } from 'react'
import { useCandidateMeta } from './useCandidateMeta'
import { useCandidateState } from './useCandidateState'
import { useAllScores } from './useAllScores'
import { useAuth } from './useAuth'
import { deriveActionItems, type ActionItem } from '@/lib/actionQueue'

export function useNotifications(): ActionItem[] {
  const { candidates } = useCandidateMeta()
  const { stateMap } = useCandidateState()
  const { user } = useAuth()
  const { byCandidate } = useAllScores(user?.id)

  const myScoresMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(byCandidate).map(([cid, byUser]) => [cid, byUser[user?.id ?? ''] ?? {}]),
      ),
    [byCandidate, user?.id],
  )

  const stateMin = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(stateMap).map(([id, s]) => [
          id,
          {
            confirmed: s.confirmed,
            interview_status: s.interview_status,
            verdict: s.verdict,
          },
        ]),
      ),
    [stateMap],
  )

  return useMemo(
    () =>
      deriveActionItems(
        candidates.map((c) => ({
          id: c.id,
          name: c.name,
          slot: c.slot,
          jobId: c.job_id,
        })),
        stateMin,
        myScoresMap,
      ),
    [candidates, stateMin, myScoresMap],
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
git add src/hooks/useNotifications.ts
git commit -m "feat(notifications): add useNotifications hook"
```

---

## Task 5: Create `NotificationBell` component

**Files:**

- Create: `src/components/layout/NotificationBell.tsx`

- [ ] **Step 1: Create `src/components/layout/NotificationBell.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon, XIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/hooks/useNotifications'
import { useJobs } from '@/hooks/useJobs'
import { TYPE_COLORS } from '@/lib/actionQueue'

export function NotificationBell() {
  const items = useNotifications()
  const { data: jobs = [] } = useJobs()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = items.filter((item) => !dismissed.has(`${item.candidateId}:${item.type}`))

  function handleRowClick(candidateId: string, jobId: number) {
    const job = jobs.find((j) => j.id === jobId)
    const params = new URLSearchParams()
    if (job) params.set('job', job.slug)
    params.set('profile', candidateId)
    navigate(`/cards?${params.toString()}`)
    setOpen(false)
  }

  function handleDismiss(e: React.MouseEvent, candidateId: string, type: string) {
    e.stopPropagation()
    setDismissed((prev) => new Set([...prev, `${candidateId}:${type}`]))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${visible.length > 0 ? ` (${visible.length})` : ''}`}
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BellIcon className="size-4" />
          {visible.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums leading-none">
              {visible.length > 99 ? '99+' : visible.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Notifications
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              All caught up
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visible.map((item) => (
                <div
                  key={`${item.candidateId}:${item.type}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(item.candidateId, item.jobId)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleRowClick(item.candidateId, item.jobId)
                  }
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: TYPE_COLORS[item.type] }}
                  />
                  <div className="flex-1 min-w-0 text-[12.5px]">
                    <span className="font-semibold text-foreground">{item.candidateName}</span>
                    <span className="text-muted-foreground ml-1.5">{item.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDismiss(e, item.candidateId, item.type)}
                    aria-label="Dismiss"
                    className="opacity-0 group-hover:opacity-50 hover:!opacity-100 p-0.5 rounded transition-opacity flex-shrink-0 text-muted-foreground"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
git add src/components/layout/NotificationBell.tsx
git commit -m "feat(notifications): add NotificationBell component"
```

---

## Task 6: Wire NotificationBell into Header

**Files:**

- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Add import and render `<NotificationBell />`**

Add import at the top of `src/components/layout/Header.tsx`:

```ts
import { NotificationBell } from './NotificationBell'
```

Inside the `<div className="flex items-center gap-1.5 flex-wrap">` action row, add `<NotificationBell />` between the job `<Select>` and the `+ Add candidate` button:

```tsx
<div className="flex items-center gap-1.5 flex-wrap">
  <Select value={jobSlug ?? 'all'} onValueChange={handleJobChange}>
    {/* ...existing select content... */}
  </Select>
  <NotificationBell />
  <Button size="sm" variant="default" onClick={onAddCandidate}>
    + Add candidate
  </Button>
  {/* ...rest of buttons... */}
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(notifications): add NotificationBell to header"
```

---

## Task 7: Remove AlertBanners

**Files:**

- Delete: `src/components/layout/AlertBanners.tsx`
- Modify: `src/components/layout/Layout.tsx`

- [ ] **Step 1: Remove `<AlertBanners />` from Layout**

In `src/components/layout/Layout.tsx`, remove the import line:

```ts
import { AlertBanners } from './AlertBanners'
```

And remove the JSX usage `<AlertBanners />`.

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/layout/AlertBanners.tsx
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Layout.tsx
git commit -m "feat(notifications): remove hardcoded AlertBanners"
```

---

## Task 8: Update ActionQueue to use shared TYPE_COLORS

**Files:**

- Modify: `src/components/cards/ActionQueue.tsx`

- [ ] **Step 1: Replace local `TYPE_COLORS` with import**

In `src/components/cards/ActionQueue.tsx`:

Remove the local constant:

```ts
const TYPE_COLORS: Record<ActionItem['type'], string> = {
  unconfirmed: 'var(--amber)',
  'no-verdict': 'var(--blue)',
  'overdue-scorecard': 'var(--red)',
}
```

Add import from `actionQueue.ts`:

```ts
import { deriveActionItems, TYPE_COLORS, type ActionItem } from '@/lib/actionQueue'
```

Also update the `CandidateSlot` interface to include `jobId`:

```ts
interface CandidateSlot {
  id: string
  name: string
  slot: string | null
  jobId: number
}
```

And update where `deriveActionItems` is called — the `candidates.map(...)` that builds `CandidateSlot` objects must now include `jobId: c.job_id`. In `CardsPage.tsx`, `allMeta` now has `job_id` from the updated `CandidateMeta`, so update the prop passed to `ActionQueue`:

In `src/pages/CardsPage.tsx`, the `<ActionQueue>` receives `candidates={allMeta}`. The `ActionQueue` component's internal map needs to pass `jobId`. Since `CandidateSlot` is internal to `ActionQueue`, update the `deriveActionItems` call:

```ts
const items = deriveActionItems(
  candidates.map((c) => ({ id: c.id, name: c.name, slot: c.slot, jobId: c.job_id })),
  stateMin,
  myScoresMap,
)
```

- [ ] **Step 2: Verify TypeScript compiles and tests pass**

```bash
yarn tsc --noEmit && yarn vitest run src/lib/__tests__/actionQueue.test.ts
```

Expected: no errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/cards/ActionQueue.tsx src/pages/CardsPage.tsx
git commit -m "refactor(notifications): ActionQueue uses shared TYPE_COLORS from actionQueue"
```

---

## Task 9: Full build verification

- [ ] **Step 1: Run full test suite**

```bash
yarn vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run build**

```bash
yarn build
```

Expected: builds without errors or warnings.

- [ ] **Step 4: Manual smoke test**

Start the dev server (`yarn dev`) and verify:

1. Bell icon appears in header between job selector and "+ Add candidate"
2. Badge count shows number of notification items
3. Clicking the bell opens the dropdown
4. Each row shows a colored dot, candidate name, and message
5. Clicking a row navigates to `/cards?job=<slug>&profile=<id>` and opens the profile modal
6. Clicking X on a row dismisses it for the session; it returns on reload
7. When all items dismissed, dropdown shows "All caught up"
8. ActionQueue on Cards tab still shows job-filtered items with correct colors
9. No `AlertBanners` renders anywhere on any tab
