# Phase 2 — Cards Page Day-of-Week Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dynamic day-of-week filter chips to the Cards page so users can quickly show only candidates scheduled on a specific day, derived entirely from `interview_at` values in the database.

**Architecture:** A new `dayFilter` state (nullable `YYYY-MM-DD` string) sits alongside the existing `FilterType` state in `CardsPage`. The `FilterBar` component gains a new optional `dayChips` prop rendering day buttons above the existing filters. `filterCandidates` in `src/lib/filters.ts` is extended to also apply a day filter. Day chips are derived at render time from the candidates data using `interviewAtToDateInput`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, existing `Button` component, `interviewAtToDateInput` from `src/lib/interview.ts`.

---

## File Map

| File                                 | Action | Responsibility                                                                     |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `src/lib/filters.ts`                 | Modify | Add `applyDayFilter` helper                                                        |
| `src/components/cards/FilterBar.tsx` | Modify | Render dynamic day chips row                                                       |
| `src/pages/CardsPage.tsx`            | Modify | Derive day chips, manage `dayFilter` state, pass to FilterBar and filterCandidates |

---

### Task 1: Add `applyDayFilter` to `filters.ts`

**Files:**

- Modify: `src/lib/filters.ts`

- [ ] **Step 1: Add the helper and update `CandidateMin` interface**

The `CandidateMin` interface needs `interview_at`. Add the helper at the bottom of the file:

```typescript
// At the top of the file, add to the CandidateMin interface:
interface CandidateMin {
  id: string
  name: string
  email: string
  interview_at?: string | null // add this field
  day?: string | null
  seniority?: string | null
}
```

Then add at the bottom of `filters.ts`:

```typescript
/**
 * Filter candidates by interview date.
 * dayFilter is a YYYY-MM-DD string; interview_at is a UTC ISO string.
 * Comparison is done in browser local time via toLocaleDateString('en-CA').
 */
export function applyDayFilter<T extends { interview_at?: string | null }>(
  candidates: T[],
  dayFilter: string | null,
): T[] {
  if (!dayFilter) return candidates
  return candidates.filter(
    (c) =>
      c.interview_at != null && new Date(c.interview_at).toLocaleDateString('en-CA') === dayFilter,
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "filters.ts"
```

Expected: no errors.

---

### Task 2: Update `FilterBar` to render day chips

**Files:**

- Modify: `src/components/cards/FilterBar.tsx`

- [ ] **Step 1: Add `dayChips` and `dayFilter` props, render a day chip row**

```typescript
// src/components/cards/FilterBar.tsx
import type { FilterType } from '@/lib/filters'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'

interface DayChip {
  date: string   // YYYY-MM-DD
  label: string  // e.g. "Sun 17 May 2026"
  isToday: boolean
}

interface FilterBarProps {
  filter: FilterType
  search: string
  total: number
  onFilterChange: (f: FilterType) => void
  onSearchChange: (s: string) => void
  // new optional props:
  dayChips?: DayChip[]
  dayFilter?: string | null
  onDayFilterChange?: (date: string | null) => void
}

const STATUS_FILTERS: { value: FilterType; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
]

const SENIORITY_FILTERS: { value: FilterType; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]

export function FilterBar({
  filter,
  search,
  total,
  onFilterChange,
  onSearchChange,
  dayChips,
  dayFilter,
  onDayFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-2 mb-[18px]">
      {/* Day filter row — only shown when there are scheduled candidates */}
      {dayChips && dayChips.length > 0 && (
        <div className="flex gap-1.5 flex-wrap items-center">
          <Button
            size="sm"
            variant={dayFilter == null ? 'default' : 'outline'}
            onClick={() => onDayFilterChange?.(null)}
          >
            All days
          </Button>
          {dayChips.map((chip) => (
            <Button
              key={chip.date}
              size="sm"
              variant={dayFilter === chip.date ? 'default' : 'outline'}
              onClick={() => onDayFilterChange?.(chip.date)}
              className={chip.isToday ? 'ring-1 ring-[var(--amber)] ring-offset-1' : ''}
            >
              {chip.label}
              {chip.isToday && <span className="ml-1 text-[var(--amber)] text-[10px] font-bold">TODAY</span>}
            </Button>
          ))}
        </div>
      )}

      {/* Status + seniority + search row */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
        >
          All ({total})
        </Button>
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <span className="w-px h-5 bg-border mx-0.5" />
        {SENIORITY_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <div className="ml-auto w-64">
          <SearchInput
            placeholder="Search name, email, notes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "FilterBar"
```

Expected: no errors.

---

### Task 3: Update `CardsPage` to derive chips and apply day filter

**Files:**

- Modify: `src/pages/CardsPage.tsx`

- [ ] **Step 1: Read the current CardsPage to find the right insertion points**

Look for: `filterCandidates`, `FilterBar`, `useState` usage, and where candidates are mapped.

- [ ] **Step 2: Add dayFilter state, derive chips, apply filter**

Add the following imports (check which are already present first):

```typescript
import { useState, useMemo } from 'react'
import { applyDayFilter } from '@/lib/filters'
import { interviewAtToDateInput, formatInterviewDate } from '@/lib/interview'
```

Add state near the other `useState` calls:

```typescript
const [dayFilter, setDayFilter] = useState<string | null>(null)
```

Derive day chips dynamically (add this after the candidates data is available):

```typescript
const dayChips = useMemo(() => {
  const today = new Date().toLocaleDateString('en-CA')
  const seen = new Set<string>()
  const chips: { date: string; label: string; isToday: boolean }[] = []

  for (const d of data) {
    const date = interviewAtToDateInput(d.candidate.interview_at)
    if (!date || seen.has(date)) continue
    seen.add(date)
    chips.push({
      date,
      label: formatInterviewDate(d.candidate.interview_at)
        .replace(/\d{4}$/, '') // strip year for compact label e.g. "Sun, 17 May"
        .trim()
        .replace(/,$/, ''),
      isToday: date === today,
    })
  }

  return chips.sort((a, b) => a.date.localeCompare(b.date))
}, [data])
```

Apply the day filter after the existing `filterCandidates` call:

```typescript
// existing call — keep as-is:
const filtered = filterCandidates(
  data.map((d) => d.candidate),
  stateMap,
  filter,
  search,
)

// add day filter on top:
const filteredWithDay = applyDayFilter(filtered, dayFilter)
```

Pass new props to `<FilterBar>`:

```typescript
<FilterBar
  filter={filter}
  search={search}
  total={data.length}
  onFilterChange={setFilter}
  onSearchChange={setSearch}
  dayChips={dayChips}
  dayFilter={dayFilter}
  onDayFilterChange={setDayFilter}
/>
```

Use `filteredWithDay` (instead of `filtered`) when rendering candidate cards.

- [ ] **Step 3: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 4: Open the app and verify**

Navigate to `http://localhost:5173/cards`. Confirm:

- A row of day chips appears above the status/seniority filters
- Each chip shows a short date label (e.g. "Sun, 17 May")
- Today's chip has an amber ring and "TODAY" badge
- Clicking a day chip filters the grid to show only that day's candidates
- "All days" chip resets the filter
- Day filter composes with status filter — e.g. "Confirmed" + "Sun 17" shows only confirmed Sunday candidates
