# Phase 4: Cards Tab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Cards tab — summary stats bar, 5-day interview timeline, action queue panel, filter/search bar, and the full candidate card grid with scorecard (with feedback blinding), checklist, comments, status/verdict buttons, and the shortlist comparison modal.

**Architecture:** `CardsPage` composes standalone components. All mutable state lives in Supabase (`interview_state` table), fetched via `useCandidateState` hook. The scorecard enforces blinding: the current user can only see their co-interviewer's scores after submitting all 5 of their own. Filtering and search run client-side over the already-fetched candidate list.

**Tech Stack:** Supabase, React 19, Tailwind, shadcn/ui, `useAuth` hook (to determine current user = peter vs. ossama)

**Prerequisites:** Phases 1–3 complete. Supabase data seeded.

---

### Task 1: Data Hooks

**Files:**
- Create: `src/hooks/useCandidates.ts`
- Create: `src/hooks/useCandidateState.ts`
- Create: `src/lib/scoring.ts`

- [ ] **Step 1: Write failing tests for scoring utilities**

Create `src/lib/__tests__/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { totalScore, maxScore, isScoreSubmitted, SCORE_CATEGORIES } from '../scoring'

const zeroScores = { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 }
const fullScores = { Communication: 5, Technical: 4, 'Culture Fit': 3, Leadership: 4, Overall: 5 }

describe('scoring', () => {
  it('maxScore returns 25 (5 categories × 5 stars)', () => {
    expect(maxScore()).toBe(25)
  })

  it('totalScore returns 0 when both scorers have zero', () => {
    expect(totalScore(zeroScores, zeroScores)).toBe(0)
  })

  it('totalScore averages both scorers when both are non-zero', () => {
    const a = { ...zeroScores, Communication: 4, Overall: 4 } // sum=8
    const b = { ...zeroScores, Communication: 2, Overall: 2 } // sum=4
    expect(totalScore(a, b)).toBe(6) // (8+4)/2 = 6
  })

  it('totalScore uses only non-zero scorer when one is zero', () => {
    expect(totalScore(fullScores, zeroScores)).toBe(21)
    expect(totalScore(zeroScores, fullScores)).toBe(21)
  })

  it('isScoreSubmitted returns false when all scores are 0', () => {
    expect(isScoreSubmitted(zeroScores)).toBe(false)
  })

  it('isScoreSubmitted returns true when all 5 categories are non-zero', () => {
    expect(isScoreSubmitted(fullScores)).toBe(true)
  })

  it('isScoreSubmitted returns false when only some categories are non-zero', () => {
    expect(isScoreSubmitted({ ...zeroScores, Communication: 3 })).toBe(false)
  })

  it('SCORE_CATEGORIES has 5 entries', () => {
    expect(SCORE_CATEGORIES).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/lib/__tests__/scoring.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement scoring utilities**

Create `src/lib/scoring.ts`:
```ts
export const SCORE_CATEGORIES = [
  'Communication',
  'Technical',
  'Culture Fit',
  'Leadership',
  'Overall',
] as const

export type ScoreCategory = (typeof SCORE_CATEGORIES)[number]
export type Scores = Record<ScoreCategory, number>

export const ZERO_SCORES: Scores = {
  Communication: 0,
  Technical: 0,
  'Culture Fit': 0,
  Leadership: 0,
  Overall: 0,
}

export function maxScore(): number {
  return SCORE_CATEGORIES.length * 5
}

export function sumScores(scores: Scores): number {
  return Object.values(scores).reduce((a, b) => a + b, 0)
}

export function totalScore(peter: Scores, ossama: Scores): number {
  const ps = sumScores(peter)
  const os = sumScores(ossama)
  if (ps > 0 && os > 0) return Math.round((ps + os) / 2)
  return ps || os
}

// A scorecard is "submitted" when ALL 5 categories have a non-zero rating
export function isScoreSubmitted(scores: Scores): boolean {
  return SCORE_CATEGORIES.every((cat) => scores[cat] > 0)
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/lib/__tests__/scoring.test.ts
```
Expected: 8 tests pass.

- [ ] **Step 5: Write failing filter tests**

Create `src/lib/__tests__/filters.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { filterCandidates } from '../filters'

const candidates = [
  { id: 'alice', name: 'Alice Smith', email: 'alice@test.com' },
  { id: 'bob', name: 'Bob Jones', email: 'bob@test.com' },
]
const stateMap = {
  alice: { shortlisted: true, verdict: 'yes', interview_status: 'completed' },
  bob: { shortlisted: null, verdict: null, interview_status: 'pending' },
}

describe('filterCandidates', () => {
  it('returns all candidates for "all" filter', () => {
    expect(filterCandidates(candidates, stateMap, 'all', '')).toHaveLength(2)
  })

  it('returns only shortlisted candidates', () => {
    const result = filterCandidates(candidates, stateMap, 'shortlisted', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('alice')
  })

  it('returns only pending candidates', () => {
    const result = filterCandidates(candidates, stateMap, 'pending', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bob')
  })

  it('filters by name search (case insensitive)', () => {
    const result = filterCandidates(candidates, stateMap, 'all', 'alice')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('alice')
  })

  it('filters by email search', () => {
    const result = filterCandidates(candidates, stateMap, 'all', 'bob@test')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bob')
  })

  it('returns empty array when no matches', () => {
    expect(filterCandidates(candidates, stateMap, 'all', 'xyz')).toHaveLength(0)
  })
})
```

- [ ] **Step 6: Implement filter utilities**

Create `src/lib/filters.ts`:
```ts
type FilterType = 'all' | 'shortlisted' | 'pending' | 'rejected'

interface Candidate {
  id: string
  name: string
  email: string
}

interface StateSnapshot {
  shortlisted: boolean | null
  verdict: string | null
  interview_status: string
}

export function filterCandidates(
  candidates: Candidate[],
  stateMap: Record<string, StateSnapshot>,
  filter: FilterType,
  search: string,
): Candidate[] {
  let result = candidates

  if (filter === 'shortlisted') {
    result = result.filter((c) => stateMap[c.id]?.shortlisted === true)
  } else if (filter === 'pending') {
    result = result.filter(
      (c) => stateMap[c.id]?.shortlisted !== true && stateMap[c.id]?.verdict === null,
    )
  } else if (filter === 'rejected') {
    result = result.filter((c) => stateMap[c.id]?.shortlisted === false)
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }

  return result
}
```

- [ ] **Step 7: Run filter tests**
```bash
npm run test:run src/lib/__tests__/filters.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 8: Implement useCandidates and useCandidateState hooks**

Create `src/hooks/useCandidates.ts`:
```ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

export interface CandidateWithDetails {
  candidate: Candidate
  profile: Profile | null
  analysis: Analysis | null
}

export function useCandidates() {
  const [data, setData] = useState<CandidateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*').order('created_at'),
      supabase.from('candidate_profiles').select('*'),
      supabase.from('candidate_analysis').select('*'),
    ])
      .then(([candidatesRes, profilesRes, analysisRes]) => {
        if (candidatesRes.error) throw candidatesRes.error
        const profileMap = Object.fromEntries(
          (profilesRes.data ?? []).map((p) => [p.candidate_id, p]),
        )
        const analysisMap = Object.fromEntries(
          (analysisRes.data ?? []).map((a) => [a.candidate_id, a]),
        )
        setData(
          (candidatesRes.data ?? []).map((c) => ({
            candidate: c,
            profile: profileMap[c.id] ?? null,
            analysis: analysisMap[c.id] ?? null,
          })),
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
```

Create `src/hooks/useCandidateState.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'
import { ZERO_SCORES } from '@/lib/scoring'

type InterviewState = Database['public']['Tables']['interview_state']['Row']
export type StateMap = Record<string, InterviewState>

export function useCandidateState() {
  const [stateMap, setStateMap] = useState<StateMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('interview_state')
      .select('*')
      .then(({ data }) => {
        if (data) {
          setStateMap(Object.fromEntries(data.map((s) => [s.candidate_id, s])))
        }
        setLoading(false)
      })
  }, [])

  const updateState = useCallback(
    async (candidateId: string, patch: Partial<InterviewState>) => {
      setStateMap((prev) => ({
        ...prev,
        [candidateId]: { ...prev[candidateId], ...patch },
      }))
      await supabase.from('interview_state').update(patch).eq('candidate_id', candidateId)
    },
    [],
  )

  const setVerdict = useCallback(
    (id: string, verdict: InterviewState['verdict']) => {
      const current = stateMap[id]?.verdict
      updateState(id, { verdict: current === verdict ? null : verdict })
    },
    [stateMap, updateState],
  )

  const setInterviewStatus = useCallback(
    (id: string, status: InterviewState['interview_status']) =>
      updateState(id, { interview_status: status }),
    [updateState],
  )

  const setShortlisted = useCallback(
    (id: string, value: boolean | null) => updateState(id, { shortlisted: value }),
    [updateState],
  )

  const setConfirmed = useCallback(
    (id: string, value: boolean) => updateState(id, { confirmed: value }),
    [updateState],
  )

  const setScores = useCallback(
    (id: string, scorer: 'peter' | 'ossama', scores: Scores) => {
      const key = scorer === 'peter' ? 'peter_scores' : 'ossama_scores'
      updateState(id, { [key]: scores })
    },
    [updateState],
  )

  const setComment = useCallback(
    (id: string, scorer: 'peter' | 'ossama', comment: string) => {
      const key = scorer === 'peter' ? 'peter_comment' : 'ossama_comment'
      updateState(id, { [key]: comment })
    },
    [updateState],
  )

  const setChecklist = useCallback(
    (id: string, checklist: Record<string, boolean>) =>
      updateState(id, { checklist }),
    [updateState],
  )

  return {
    stateMap, loading,
    setVerdict, setInterviewStatus, setShortlisted, setConfirmed,
    setScores, setComment, setChecklist,
  }
}
```

- [ ] **Step 9: Commit**
```bash
git add -A
git commit -m "feat(cards): add scoring, filter utilities and data hooks"
```

---

### Task 2: Summary Stats Bar + Timeline

**Files:**
- Create: `src/components/cards/SummaryBar.tsx`
- Create: `src/components/cards/InterviewTimeline.tsx`

- [ ] **Step 1: Build SummaryBar**

Create `src/components/cards/SummaryBar.tsx`:
```tsx
import type { StateMap } from '@/hooks/useCandidateState'

interface SummaryBarProps {
  total: number
  stateMap: StateMap
}

export function SummaryBar({ total, stateMap }: SummaryBarProps) {
  const states = Object.values(stateMap)
  const confirmed = states.filter((s) => s.confirmed).length
  const shortlisted = states.filter((s) => s.shortlisted === true).length
  const pending = states.filter((s) => s.interview_status === 'pending').length
  const completed = states.filter((s) => s.interview_status === 'completed').length

  const stats = [
    { num: total, lbl: 'Total Candidates', color: 'var(--text3)' },
    { num: confirmed, lbl: 'Confirmed', color: 'var(--green)' },
    { num: shortlisted, lbl: 'Shortlisted', color: 'var(--brand)' },
    { num: pending, lbl: 'Pending', color: 'var(--amber)' },
    { num: completed, lbl: 'Completed', color: 'var(--blue)' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.lbl}
          className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] transition-all duration-150"
        >
          <div className="text-[30px] font-medium tracking-[-0.03em] leading-none font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {s.num}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-text3">
              {s.lbl}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Build InterviewTimeline**

Create `src/components/cards/InterviewTimeline.tsx`:
```tsx
import type { StateMap } from '@/hooks/useCandidateState'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']

const DAYS = ['Sunday 17 May', 'Monday 18 May', 'Tuesday 19 May', 'Wednesday 20 May', 'Thursday 21 May']
const DAY_LABELS = ['Sun 17', 'Mon 18', 'Tue 19', 'Wed 20', 'Thu 21']
const TODAY = 'Tuesday 19 May' // derive dynamically in production

interface InterviewTimelineProps {
  candidates: Candidate[]
  stateMap: StateMap
}

export function InterviewTimeline({ candidates, stateMap }: InterviewTimelineProps) {
  const counts = DAYS.map((day) => candidates.filter((c) => c.day === day).length)
  const maxCount = Math.max(...counts, 1)
  const todayIdx = DAYS.indexOf(TODAY)

  return (
    <div className="grid grid-cols-5 mb-6 bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
      {DAYS.map((day, i) => {
        const isPast = i < todayIdx
        const isToday = i === todayIdx
        const count = counts[i]
        const fillPct = Math.round((count / maxCount) * 100)

        return (
          <div
            key={day}
            className={[
              'px-4 py-3.5 border-r border-border last:border-r-0 flex flex-col gap-1.5 relative transition-colors duration-150 hover:bg-surface2',
              isToday ? 'bg-gradient-to-b from-amber-bg to-transparent' : '',
            ].join(' ')}
          >
            {isToday && (
              <span className="absolute top-2.5 right-3 text-[9px] font-bold tracking-[0.1em] text-amber">
                TODAY
              </span>
            )}
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text3">
              {DAY_LABELS[i]}
            </span>
            <span
              className="text-[26px] font-medium leading-none tracking-[-0.03em]"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {count}
            </span>
            <div className="h-[3px] rounded-full bg-surface3 overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${fillPct}%`,
                  background: isPast ? 'var(--green)' : isToday ? 'var(--amber)' : 'var(--text)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat(cards): add summary bar and interview timeline"
```

---

### Task 3: Action Queue + Filter Bar

**Files:**
- Create: `src/components/cards/ActionQueue.tsx`
- Create: `src/components/cards/FilterBar.tsx`

- [ ] **Step 1: Write failing test for action queue derivation**

Create `src/lib/__tests__/actionQueue.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { deriveActionItems } from '../actionQueue'

describe('deriveActionItems', () => {
  it('flags missing confirmation', () => {
    const items = deriveActionItems(
      [{ id: 'a', name: 'Alice', slot: 'Sun 17 May' }],
      { a: { confirmed: false, interview_status: 'pending', verdict: null, peter_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 }, ossama_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 } } },
    )
    expect(items.some((i) => i.type === 'unconfirmed' && i.candidateId === 'a')).toBe(true)
  })

  it('flags done interview with no verdict', () => {
    const items = deriveActionItems(
      [{ id: 'b', name: 'Bob', slot: 'Mon 18 May' }],
      { b: { confirmed: true, interview_status: 'completed', verdict: null, peter_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 }, ossama_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 } } },
    )
    expect(items.some((i) => i.type === 'no-verdict' && i.candidateId === 'b')).toBe(true)
  })

  it('flags overdue scorecard (completed, all scores zero, no verdict)', () => {
    const items = deriveActionItems(
      [{ id: 'c', name: 'Carol', slot: 'Tue 19 May' }],
      { c: { confirmed: true, interview_status: 'completed', verdict: null, peter_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 }, ossama_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 } } },
    )
    expect(items.some((i) => i.type === 'overdue-scorecard' && i.candidateId === 'c')).toBe(true)
  })

  it('returns no items for a clean candidate', () => {
    const items = deriveActionItems(
      [{ id: 'd', name: 'Dan', slot: 'Thu 21 May' }],
      { d: { confirmed: true, interview_status: 'completed', verdict: 'yes', peter_scores: { Communication:5,Technical:4,'Culture Fit':4,Leadership:4,Overall:4 }, ossama_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 } } },
    )
    expect(items.filter((i) => i.candidateId === 'd')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/lib/__tests__/actionQueue.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement action queue utility**

Create `src/lib/actionQueue.ts`:
```ts
import { isScoreSubmitted } from './scoring'
import type { Scores } from './scoring'

export type ActionItemType = 'unconfirmed' | 'no-verdict' | 'overdue-scorecard'

export interface ActionItem {
  type: ActionItemType
  candidateId: string
  candidateName: string
  message: string
}

interface CandidateMin { id: string; name: string; slot: string | null }
interface StateMin {
  confirmed: boolean
  interview_status: string
  verdict: string | null
  peter_scores: Scores
  ossama_scores: Scores
}

export function deriveActionItems(
  candidates: CandidateMin[],
  stateMap: Record<string, StateMin>,
): ActionItem[] {
  const items: ActionItem[] = []

  for (const c of candidates) {
    const s = stateMap[c.id]
    if (!s) continue

    if (!s.confirmed && c.slot && c.slot !== 'TBD') {
      items.push({ type: 'unconfirmed', candidateId: c.id, candidateName: c.name, message: `Confirmation pending` })
    }

    if (s.interview_status === 'completed' && s.verdict === null) {
      items.push({ type: 'no-verdict', candidateId: c.id, candidateName: c.name, message: `Interview done — no verdict set` })
    }

    if (
      s.interview_status === 'completed' &&
      !isScoreSubmitted(s.peter_scores) &&
      !isScoreSubmitted(s.ossama_scores)
    ) {
      items.push({ type: 'overdue-scorecard', candidateId: c.id, candidateName: c.name, message: `Scorecard overdue` })
    }
  }

  return items
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/lib/__tests__/actionQueue.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 5: Build ActionQueue component**

Create `src/components/cards/ActionQueue.tsx`:
```tsx
import { useState } from 'react'
import { deriveActionItems, type ActionItem } from '@/lib/actionQueue'
import type { StateMap } from '@/hooks/useCandidateState'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'

type Candidate = Database['public']['Tables']['candidates']['Row']

interface ActionQueueProps {
  candidates: Candidate[]
  stateMap: StateMap
}

const TYPE_COLORS: Record<ActionItem['type'], string> = {
  unconfirmed: 'var(--amber)',
  'no-verdict': 'var(--blue)',
  'overdue-scorecard': 'var(--red)',
}

export function ActionQueue({ candidates, stateMap }: ActionQueueProps) {
  const [open, setOpen] = useState(true)

  const stateMin = Object.fromEntries(
    Object.entries(stateMap).map(([id, s]) => [
      id,
      {
        confirmed: s.confirmed,
        interview_status: s.interview_status,
        verdict: s.verdict,
        peter_scores: s.peter_scores as Scores,
        ossama_scores: s.ossama_scores as Scores,
      },
    ]),
  )

  const items = deriveActionItems(
    candidates.map((c) => ({ id: c.id, name: c.name, slot: c.slot })),
    stateMin,
  )

  if (!items.length) return null

  return (
    <div className="mb-4 bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface2 transition-colors cursor-pointer"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-amber-bg border border-amber-line text-amber text-[9px] flex items-center justify-center font-bold">
            {items.length}
          </span>
          Needs Attention
        </span>
        <span className="text-text3 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-sans">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[item.type] }} />
              <span className="font-semibold text-text">{item.candidateName}</span>
              <span className="text-text3">—</span>
              <span className="text-text2">{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Build FilterBar**

Create `src/components/cards/FilterBar.tsx`:
```tsx
type FilterType = 'all' | 'shortlisted' | 'pending' | 'rejected'

interface FilterBarProps {
  filter: FilterType
  search: string
  onFilterChange: (f: FilterType) => void
  onSearchChange: (s: string) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

export function FilterBar({ filter, search, onFilterChange, onSearchChange }: FilterBarProps) {
  return (
    <div className="flex gap-1.5 mb-4 flex-wrap items-center">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={[
            'px-3 py-1.5 rounded-full text-xs font-medium font-sans border transition-all duration-150 cursor-pointer',
            filter === f.value
              ? 'bg-text text-bg border-text'
              : 'bg-surface border-border text-text2 hover:border-border-strong hover:text-text',
          ].join(' ')}
        >
          {f.label}
        </button>
      ))}
      <div className="ml-auto relative">
        <input
          type="search"
          placeholder="Search candidates..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-surface border border-border rounded-full pl-8 pr-4 py-1.5 text-[12.5px] font-sans text-text w-64 outline-none focus:border-text transition-colors placeholder:text-text3"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%2392907f' stroke-width='1.6' stroke-linecap='round'><circle cx='6.2' cy='6.2' r='4.5'/><path d='m9.7 9.7 3.3 3.3'/></svg>")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '10px center',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(cards): add action queue and filter bar"
```

---

### Task 4: Candidate Card — Header, Body, Checklist, Comments

**Files:**
- Create: `src/components/cards/CandidateCard.tsx`
- Create: `src/components/cards/CardHeader.tsx`
- Create: `src/components/cards/CardBody.tsx`
- Create: `src/components/cards/Checklist.tsx`
- Create: `src/components/cards/Comments.tsx`

- [ ] **Step 1: Build CardHeader (avatar, name, badges, confirm toggle)**

Create `src/components/cards/CardHeader.tsx`:
```tsx
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, oklch(0.72 0.12 250), oklch(0.5 0.14 270))',
  'linear-gradient(135deg, oklch(0.75 0.1 145), oklch(0.55 0.12 160))',
  'linear-gradient(135deg, oklch(0.78 0.1 25), oklch(0.58 0.14 15))',
  'linear-gradient(135deg, oklch(0.82 0.12 80), oklch(0.62 0.14 60))',
  'linear-gradient(135deg, oklch(0.72 0.12 300), oklch(0.5 0.15 290))',
  'linear-gradient(135deg, oklch(0.75 0.1 195), oklch(0.55 0.12 210))',
  'linear-gradient(135deg, oklch(0.78 0.08 90), oklch(0.55 0.1 70))',
]

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function avatarGradient(index: number): string {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
}

interface CardHeaderProps {
  candidate: Candidate
  state: State
  index: number
  onConfirmToggle: () => void
  onOpenProfile: () => void
}

export function CardHeader({ candidate, state, index, onConfirmToggle, onOpenProfile }: CardHeaderProps) {
  return (
    <div className="px-4 pb-3 pt-3.5 border-b border-border flex items-start gap-3 bg-gradient-to-b from-surface to-[color-mix(in_srgb,var(--surface2)_30%,var(--surface))]">
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0 cursor-pointer"
        style={{ background: avatarGradient(index), boxShadow: '0 1px 0 rgba(255,255,255,.4) inset, 0 1px 2px rgba(0,0,0,.06)' }}
        onClick={onOpenProfile}
      >
        {state.photo_url
          ? <img src={state.photo_url} alt={candidate.name} className="w-full h-full rounded-full object-cover" />
          : initials(candidate.name)
        }
      </div>

      <div className="flex-1 min-w-0">
        <button
          className="text-[14.5px] font-semibold tracking-[-0.015em] text-text text-left hover:text-brand transition-colors cursor-pointer bg-transparent border-none p-0"
          onClick={onOpenProfile}
        >
          {candidate.name}
        </button>
        <p className="text-[11.5px] text-text2 mt-0.5 truncate">{candidate.email}</p>
        <div className="flex gap-1 flex-wrap mt-1.5">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${state.confirmed ? 'bg-green-bg text-green border-green-line' : 'bg-amber-bg text-amber border-amber-line'}`}>
            {state.confirmed ? 'Confirmed' : 'Pending'}
          </span>
          {candidate.type === 'Remote' && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-blue-bg text-blue border-blue-line">
              Remote
            </span>
          )}
        </div>
      </div>

      {/* Confirm toggle */}
      <button
        onClick={onConfirmToggle}
        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all duration-150 flex-shrink-0 ${
          state.confirmed
            ? 'bg-green-bg text-green border-green-line hover:bg-red-bg hover:text-red hover:border-red-line'
            : 'bg-amber-bg text-amber border-amber-line hover:bg-amber hover:text-white hover:border-amber'
        }`}
      >
        {state.confirmed ? 'Confirmed' : 'Pending'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Build CardBody (info rows)**

Create `src/components/cards/CardBody.tsx`:
```tsx
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']

interface CardBodyProps {
  candidate: Candidate
}

export function CardBody({ candidate }: CardBodyProps) {
  const rows = [
    { label: 'Slot', value: candidate.slot },
    { label: 'Type', value: candidate.type },
    { label: 'Salary', value: candidate.salary },
    { label: 'Notice', value: candidate.notice },
  ]

  return (
    <div className="px-4 py-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between items-start py-[5px] border-b border-dashed border-border last:border-b-0 text-xs gap-3"
        >
          <span className="text-text2 font-medium text-[11px] uppercase tracking-[0.04em] flex-shrink-0">
            {row.label}
          </span>
          <span className="text-text text-right font-[450]" style={{ fontFeatureSettings: '"tnum"' }}>
            {row.value ?? '—'}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Build Checklist**

Create `src/components/cards/Checklist.tsx`:
```tsx
const CHECKLIST_ITEMS = [
  'CV reviewed',
  'LinkedIn checked',
  'Questions prepared',
  'Salary discussed',
  'Notice period confirmed',
]

interface ChecklistProps {
  candidateId: string
  checklist: Record<string, boolean>
  onChange: (updated: Record<string, boolean>) => void
}

export function Checklist({ checklist, onChange }: ChecklistProps) {
  const toggle = (item: string) => {
    onChange({ ...checklist, [item]: !checklist[item] })
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-2.5">
        Pre-Interview Checklist
      </p>
      {CHECKLIST_ITEMS.map((item) => (
        <label
          key={item}
          className={`flex items-center gap-2 mb-1.5 text-[11.5px] cursor-pointer transition-colors ${
            checklist[item] ? 'text-text3 line-through decoration-[1px]' : 'text-text2 hover:text-text'
          }`}
        >
          <input
            type="checkbox"
            checked={!!checklist[item]}
            onChange={() => toggle(item)}
            className="w-3.5 h-3.5 cursor-pointer flex-shrink-0 accent-[var(--green)]"
          />
          {item}
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Build Comments**

Create `src/components/cards/Comments.tsx`:
```tsx
import { useState } from 'react'

interface CommentsProps {
  candidateId: string
  peterComment: string
  ossamaComment: string
  onSavePeter: (comment: string) => void
  onSaveOssama: (comment: string) => void
}

export function Comments({ peterComment, ossamaComment, onSavePeter, onSaveOssama }: CommentsProps) {
  const [peter, setPeter] = useState(peterComment)
  const [ossama, setOssama] = useState(ossamaComment)
  const [peterSaved, setPeterSaved] = useState(false)
  const [ossamaSaved, setOssamaSaved] = useState(false)

  const handleSave = (scorer: 'peter' | 'ossama') => {
    if (scorer === 'peter') {
      onSavePeter(peter)
      setPeterSaved(true)
      setTimeout(() => setPeterSaved(false), 2000)
    } else {
      onSaveOssama(ossama)
      setOssamaSaved(true)
      setTimeout(() => setOssamaSaved(false), 2000)
    }
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
        Comments
      </p>
      {[
        { key: 'peter' as const, label: 'Peter', value: peter, saved: peterSaved, color: 'var(--purple)', onChange: setPeter },
        { key: 'ossama' as const, label: 'Ossama', value: ossama, saved: ossamaSaved, color: 'var(--blue)', onChange: setOssama },
      ].map((scorer) => (
        <div key={scorer.key} className="mb-3 last:mb-0">
          <p className="text-[10.5px] font-medium text-text2 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: scorer.color }} />
            {scorer.label}
          </p>
          <textarea
            value={scorer.value}
            onChange={(e) => scorer.onChange(e.target.value)}
            placeholder={`${scorer.label}'s notes...`}
            className="w-full font-sans text-xs text-text bg-surface2 border border-border rounded-[var(--radius-xs)] px-2.5 py-1.5 resize-y min-h-[54px] outline-none focus:border-text focus:bg-surface transition-colors"
          />
          <button
            onClick={() => handleSave(scorer.key)}
            className="mt-1.5 text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius-xs)] bg-text text-bg cursor-pointer hover:opacity-85 transition-opacity border-none font-sans"
          >
            Save
          </button>
          {scorer.saved && <span className="text-[10.5px] text-green ml-2 font-medium">Saved</span>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(cards): add card header, body, checklist, and comments"
```

---

### Task 5: Scorecard with Feedback Blinding

**Files:**
- Create: `src/components/cards/Scorecard.tsx`

- [ ] **Step 1: Write failing blinding tests**

Create `src/components/cards/__tests__/Scorecard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Scorecard } from '../Scorecard'
import type { Scores } from '@/lib/scoring'

const zero: Scores = { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 }
const full: Scores = { Communication: 5, Technical: 4, 'Culture Fit': 4, Leadership: 4, Overall: 4 }

describe('Scorecard blinding', () => {
  it('hides co-interviewer scores before own submission', () => {
    render(
      <Scorecard
        currentUser="peter"
        peterScores={zero}
        ossamaScores={full}
        onPeterChange={vi.fn()}
        onOssamaChange={vi.fn()}
      />,
    )
    // Ossama's scores should be hidden
    expect(screen.getByText(/Reveal Ossama's scores/i)).toBeTruthy()
    // Peter's editable stars should be present
    expect(screen.getAllByRole('button', { name: /star/i }).length).toBeGreaterThan(0)
  })

  it('shows reveal button only after own submission (all 5 rated)', () => {
    render(
      <Scorecard
        currentUser="peter"
        peterScores={full}
        ossamaScores={full}
        onPeterChange={vi.fn()}
        onOssamaChange={vi.fn()}
      />,
    )
    // After Peter submits all 5, co-scores are visible (no reveal button)
    expect(screen.queryByText(/Reveal Ossama's scores/i)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/components/cards/__tests__/Scorecard.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement Scorecard with blinding**

Create `src/components/cards/Scorecard.tsx`:
```tsx
import { useState } from 'react'
import { SCORE_CATEGORIES, isScoreSubmitted, sumScores, maxScore } from '@/lib/scoring'
import type { Scores } from '@/lib/scoring'

interface ScorecardProps {
  currentUser: 'peter' | 'ossama'
  peterScores: Scores
  ossamaScores: Scores
  onPeterChange: (scores: Scores) => void
  onOssamaChange: (scores: Scores) => void
}

function StarRating({
  category,
  value,
  onChange,
  readonly = false,
}: {
  category: string
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex items-center justify-between mb-1.5 text-[11.5px]">
      <span className="text-text2 w-28 flex-shrink-0">{category}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            aria-label={`star ${star} for ${category}`}
            onClick={() => !readonly && onChange?.(star)}
            disabled={readonly}
            className={[
              'text-sm leading-none transition-all duration-150',
              readonly ? 'cursor-default opacity-60' : 'cursor-pointer hover:scale-110',
              value >= star ? 'text-[#e4a82b]' : 'text-border-strong',
            ].join(' ')}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function Scorecard({
  currentUser,
  peterScores,
  ossamaScores,
  onPeterChange,
  onOssamaChange,
}: ScorecardProps) {
  const [revealed, setRevealed] = useState(false)

  const myScores = currentUser === 'peter' ? peterScores : ossamaScores
  const coScores = currentUser === 'peter' ? ossamaScores : peterScores
  const coName = currentUser === 'peter' ? 'Ossama' : 'Peter'
  const onMyChange = currentUser === 'peter' ? onPeterChange : onOssamaChange

  const mySubmitted = isScoreSubmitted(myScores)
  const coSubmitted = isScoreSubmitted(coScores)
  const canReveal = mySubmitted

  const pTotal = sumScores(peterScores)
  const oTotal = sumScores(ossamaScores)
  const combined = pTotal > 0 && oTotal > 0 ? Math.round((pTotal + oTotal) / 2) : (pTotal || oTotal)

  return (
    <div className="px-4 py-3.5 border-t border-border bg-surface">
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3">Scorecard</p>
        <span className="font-mono text-[13px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-[6px]">
          {combined}/{maxScore()}
        </span>
      </div>

      {/* My scores (always editable) */}
      <p className="text-[10px] font-medium text-text3 mb-1.5 uppercase tracking-[0.06em]">
        {currentUser === 'peter' ? 'Peter' : 'Ossama'} (you)
      </p>
      {SCORE_CATEGORIES.map((cat) => (
        <StarRating
          key={cat}
          category={cat}
          value={myScores[cat]}
          onChange={(v) => onMyChange({ ...myScores, [cat]: v })}
        />
      ))}

      {/* Co-interviewer scores — blinded until own submission */}
      <div className="mt-3">
        <p className="text-[10px] font-medium text-text3 mb-1.5 uppercase tracking-[0.06em]">
          {coName}
        </p>
        {!canReveal || (!revealed && coSubmitted) ? (
          canReveal && coSubmitted ? (
            <button
              onClick={() => setRevealed(true)}
              className="text-[11px] font-medium text-brand bg-brand-soft border border-[color-mix(in_srgb,var(--brand)_25%,transparent)] px-3 py-1.5 rounded-[var(--radius-xs)] cursor-pointer hover:bg-brand hover:text-white transition-all"
            >
              Reveal {coName}&apos;s scores
            </button>
          ) : !canReveal ? (
            <p className="text-[11px] text-text3 italic">
              Submit your own scores first to see {coName}&apos;s ratings.
            </p>
          ) : (
            <p className="text-[11px] text-text3 italic">{coName} hasn&apos;t scored yet.</p>
          )
        ) : (
          SCORE_CATEGORIES.map((cat) => (
            <StarRating key={cat} category={cat} value={coScores[cat]} readonly />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/components/cards/__tests__/Scorecard.test.tsx
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(cards): add scorecard with feedback blinding"
```

---

### Task 6: Status/Verdict Buttons + Card Actions + Full CandidateCard

**Files:**
- Create: `src/components/cards/StatusVerdictButtons.tsx`
- Create: `src/components/cards/CardActions.tsx`
- Create: `src/components/cards/CandidateCard.tsx`
- Modify: `src/pages/CardsPage.tsx`

- [ ] **Step 1: Build StatusVerdictButtons**

Create `src/components/cards/StatusVerdictButtons.tsx`:
```tsx
import type { Database } from '@/lib/database.types'

type Status = Database['public']['Tables']['interview_state']['Row']['interview_status']
type Verdict = Database['public']['Tables']['interview_state']['Row']['verdict']

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'pending', label: 'Not Started', color: 'var(--text3)' },
  { value: 'in-progress', label: 'In Progress', color: 'var(--amber)' },
  { value: 'completed', label: 'Done', color: 'var(--green)' },
]

const VERDICT_OPTIONS: { value: NonNullable<Verdict>; label: string; color: string }[] = [
  { value: 'strong-yes', label: '⭐ Strong Yes', color: 'var(--green)' },
  { value: 'yes', label: '✓ Yes', color: 'var(--blue)' },
  { value: 'maybe', label: '? Maybe', color: 'var(--amber)' },
  { value: 'no', label: '✗ No', color: 'var(--red)' },
]

interface Props {
  status: Status
  verdict: Verdict
  onStatusChange: (s: Status) => void
  onVerdictChange: (v: NonNullable<Verdict>) => void
}

export function StatusVerdictButtons({ status, verdict, onStatusChange, onVerdictChange }: Props) {
  return (
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text3 mr-1">Status:</span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-all font-sans border"
            style={status === s.value
              ? { background: s.color, color: '#fff', borderColor: s.color }
              : { background: 'none', color: 'var(--text2)', borderColor: 'var(--border)' }
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text3 mr-1">Verdict:</span>
        {VERDICT_OPTIONS.map((v) => (
          <button
            key={v.value}
            onClick={() => onVerdictChange(v.value)}
            className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-all font-sans border"
            style={verdict === v.value
              ? { background: v.color, color: '#fff', borderColor: v.color }
              : { background: 'none', color: 'var(--text2)', borderColor: 'var(--border)' }
            }
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build CardActions**

Create `src/components/cards/CardActions.tsx`:
```tsx
interface CardActionsProps {
  isShortlisted: boolean | null
  onShortlist: () => void
  onReject: () => void
  onViewProfile: () => void
  onEmailDraft: () => void
  auditLine?: string
}

export function CardActions({
  isShortlisted,
  onShortlist,
  onReject,
  onViewProfile,
  onEmailDraft,
  auditLine,
}: CardActionsProps) {
  return (
    <div className="px-4 py-2.5 border-t border-border bg-surface2 flex gap-1.5 flex-wrap items-center">
      <button
        onClick={onShortlist}
        className={`text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border cursor-pointer transition-all ${
          isShortlisted
            ? 'bg-surface text-green border-green-line hover:bg-green hover:text-white hover:border-green'
            : 'bg-surface text-green border-green-line hover:bg-green hover:text-white hover:border-green'
        }`}
      >
        {isShortlisted ? '★ Shortlisted' : 'Shortlist'}
      </button>
      <button
        onClick={onReject}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-red-line text-red bg-surface cursor-pointer hover:bg-red hover:text-white hover:border-red transition-all"
      >
        Reject
      </button>
      <button
        onClick={onViewProfile}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-border text-text bg-surface cursor-pointer hover:bg-text hover:text-bg hover:border-text transition-all"
      >
        Profile
      </button>
      <button
        onClick={onEmailDraft}
        className="text-[11.5px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border border-border text-text2 bg-transparent cursor-pointer hover:bg-surface3 hover:text-text hover:border-border transition-all"
      >
        Email
      </button>
      {auditLine && (
        <span className="ml-auto text-[10px] text-text3 truncate">{auditLine}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Build the full CandidateCard**

Create `src/components/cards/CandidateCard.tsx`:
```tsx
import { useState } from 'react'
import { CardHeader } from './CardHeader'
import { CardBody } from './CardBody'
import { Scorecard } from './Scorecard'
import { Checklist } from './Checklist'
import { Comments } from './Comments'
import { StatusVerdictButtons } from './StatusVerdictButtons'
import { CardActions } from './CardActions'
import type { Database } from '@/lib/database.types'
import type { Scores } from '@/lib/scoring'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

interface CandidateCardProps {
  candidate: Candidate
  state: State
  index: number
  currentUser: 'peter' | 'ossama'
  onConfirmToggle: () => void
  onStatusChange: (s: State['interview_status']) => void
  onVerdictChange: (v: NonNullable<State['verdict']>) => void
  onShortlist: () => void
  onReject: () => void
  onScoreChange: (scorer: 'peter' | 'ossama', scores: Scores) => void
  onCommentChange: (scorer: 'peter' | 'ossama', comment: string) => void
  onChecklistChange: (checklist: Record<string, boolean>) => void
  onOpenProfile: () => void
  onEmailDraft: () => void
  auditLine?: string
}

const STATUS_BANNER: Record<string, { label: string; cls: string }> = {
  shortlisted: { label: '★ Shortlisted', cls: 'bg-gradient-to-r from-green-bg to-transparent text-green border-b border-green-line' },
  rejected: { label: '✕ Rejected', cls: 'bg-red-bg text-red border-b border-red-line' },
}

export function CandidateCard({
  candidate, state, index, currentUser,
  onConfirmToggle, onStatusChange, onVerdictChange,
  onShortlist, onReject, onScoreChange, onCommentChange,
  onChecklistChange, onOpenProfile, onEmailDraft, auditLine,
}: CandidateCardProps) {
  const [overdueWarning] = useState(
    state.interview_status === 'completed' &&
    Object.values(state.peter_scores as Scores).every((v) => v === 0) &&
    Object.values(state.ossama_scores as Scores).every((v) => v === 0),
  )

  const bannerKey = state.shortlisted === true ? 'shortlisted' : state.shortlisted === false ? 'rejected' : null
  const banner = bannerKey ? STATUS_BANNER[bannerKey] : null

  return (
    <div
      className={[
        'bg-surface border rounded-[var(--radius)] overflow-hidden flex flex-col transition-all duration-150 shadow-[var(--shadow-sm)]',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-border-strong',
        state.shortlisted === true ? 'border-green-line shadow-[0_0_0_1px_var(--green-line),var(--shadow-sm)]' : 'border-border',
        state.shortlisted === false ? 'opacity-70 hover:opacity-95' : '',
      ].join(' ')}
    >
      {banner && (
        <div className={`px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5 ${banner.cls}`}>
          {banner.label}
        </div>
      )}

      {overdueWarning && (
        <div className="px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] bg-amber-bg text-amber border-b border-amber-line">
          ⚠ Scorecard overdue
        </div>
      )}

      <CardHeader
        candidate={candidate}
        state={state}
        index={index}
        onConfirmToggle={onConfirmToggle}
        onOpenProfile={onOpenProfile}
      />
      <CardBody candidate={candidate} />
      <StatusVerdictButtons
        status={state.interview_status}
        verdict={state.verdict}
        onStatusChange={onStatusChange}
        onVerdictChange={onVerdictChange}
      />
      <Scorecard
        currentUser={currentUser}
        peterScores={state.peter_scores as Scores}
        ossamaScores={state.ossama_scores as Scores}
        onPeterChange={(scores) => onScoreChange('peter', scores)}
        onOssamaChange={(scores) => onScoreChange('ossama', scores)}
      />
      <Checklist
        candidateId={candidate.id}
        checklist={state.checklist as Record<string, boolean>}
        onChange={onChecklistChange}
      />
      <Comments
        candidateId={candidate.id}
        peterComment={state.peter_comment}
        ossamaComment={state.ossama_comment}
        onSavePeter={(c) => onCommentChange('peter', c)}
        onSaveOssama={(c) => onCommentChange('ossama', c)}
      />
      <CardActions
        isShortlisted={state.shortlisted}
        onShortlist={onShortlist}
        onReject={onReject}
        onViewProfile={onOpenProfile}
        onEmailDraft={onEmailDraft}
        auditLine={auditLine}
      />
    </div>
  )
}
```

- [ ] **Step 4: Wire up the full CardsPage**

Replace `src/pages/CardsPage.tsx`:
```tsx
import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { useAuth } from '@/hooks/useAuth'
import { SummaryBar } from '@/components/cards/SummaryBar'
import { InterviewTimeline } from '@/components/cards/InterviewTimeline'
import { ActionQueue } from '@/components/cards/ActionQueue'
import { FilterBar } from '@/components/cards/FilterBar'
import { CandidateCard } from '@/components/cards/CandidateCard'
import { filterCandidates } from '@/lib/filters'
import type { Scores } from '@/lib/scoring'
import type { Database } from '@/lib/database.types'

type FilterType = 'all' | 'shortlisted' | 'pending' | 'rejected'
type State = Database['public']['Tables']['interview_state']['Row']

// Derive current user from email: peter@ → 'peter', else → 'ossama'
function resolveUser(email: string | undefined): 'peter' | 'ossama' {
  return email?.startsWith('peter') ? 'peter' : 'ossama'
}

export function CardsPage() {
  const { data, loading } = useCandidates()
  const { stateMap, setVerdict, setInterviewStatus, setShortlisted, setConfirmed, setScores, setComment, setChecklist } = useCandidateState()
  const { user } = useAuth()
  const currentUser = resolveUser(user?.email)

  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>
  }

  const candidates = data.map((d) => d.candidate)
  const stateMin = Object.fromEntries(
    Object.entries(stateMap).map(([id, s]) => [id, {
      shortlisted: s.shortlisted,
      verdict: s.verdict,
      interview_status: s.interview_status,
    }])
  )
  const filtered = filterCandidates(candidates, stateMin, filter, search)

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 leading-none text-text">Candidate Cards</h1>
      <p className="text-[13.5px] text-text2 mb-6">Senior PM · May 17–21, 2026</p>

      <SummaryBar total={candidates.length} stateMap={stateMap} />
      <InterviewTimeline candidates={candidates} stateMap={stateMap} />
      <ActionQueue candidates={candidates} stateMap={stateMap} />
      <FilterBar filter={filter} search={search} onFilterChange={setFilter} onSearchChange={setSearch} />

      {filtered.length === 0 ? (
        <div className="col-span-full text-center py-20 text-text3 text-sm">No candidates match your filter.</div>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {filtered.map((candidate, i) => {
            const state = stateMap[candidate.id]
            if (!state) return null
            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                state={state}
                index={i}
                currentUser={currentUser}
                onConfirmToggle={() => setConfirmed(candidate.id, !state.confirmed)}
                onStatusChange={(s) => setInterviewStatus(candidate.id, s)}
                onVerdictChange={(v) => setVerdict(candidate.id, v)}
                onShortlist={() => setShortlisted(candidate.id, state.shortlisted === true ? null : true)}
                onReject={() => setShortlisted(candidate.id, state.shortlisted === false ? null : false)}
                onScoreChange={(scorer, scores: Scores) => setScores(candidate.id, scorer, scores)}
                onCommentChange={(scorer, comment) => setComment(candidate.id, scorer, comment)}
                onChecklistChange={(checklist) => setChecklist(candidate.id, checklist)}
                onOpenProfile={() => {/* Profile modal wired in Phase 5 */}}
                onEmailDraft={() => {/* Email draft wired in Phase 5 */}}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify in browser**
```bash
npm run dev
```
Sign in and navigate to `/cards`. Expected:
- 20 candidate cards load from Supabase
- Summary stats are accurate
- Timeline shows correct day counts
- Filter pills and search work
- Scorecard blinding: you cannot see co-interviewer scores until you rate all 5 categories
- Status/verdict buttons update and persist on refresh

Kill the server.

- [ ] **Step 6: Run all tests**
```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(cards): complete cards tab with full candidate card grid"
```

---

### Task 7: Shortlist Comparison Modal

**Files:**
- Create: `src/components/cards/ShortlistComparison.tsx`
- Modify: `src/pages/CardsPage.tsx` (wire up the ★ Shortlist button in header)

- [ ] **Step 1: Build ShortlistComparison modal**

Create `src/components/cards/ShortlistComparison.tsx`:
```tsx
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import { totalScore, maxScore } from '@/lib/scoring'
import type { Scores } from '@/lib/scoring'

interface ShortlistComparisonProps {
  candidates: CandidateWithDetails[]
  stateMap: StateMap
  onClose: () => void
}

const VERDICT_LABELS: Record<string, string> = {
  'strong-yes': '⭐ Strong Yes',
  yes: '✓ Yes',
  maybe: '? Maybe',
  no: '✗ No',
}
const VERDICT_COLORS: Record<string, string> = {
  'strong-yes': 'var(--green)',
  yes: 'var(--blue)',
  maybe: 'var(--amber)',
  no: 'var(--red)',
}

export function ShortlistComparison({ candidates, stateMap, onClose }: ShortlistComparisonProps) {
  const shortlisted = candidates.filter(
    ({ candidate }) => stateMap[candidate.id]?.shortlisted === true,
  )
  const max = maxScore()

  if (!shortlisted.length) {
    return (
      <div
        className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-5"
        onClick={onClose}
      >
        <div className="bg-bg rounded-[var(--radius)] p-8 text-center shadow-[var(--shadow-lg)]">
          <p className="text-text font-semibold mb-2">No candidates shortlisted yet.</p>
          <p className="text-text2 text-sm mb-4">Use the Shortlist button on candidate cards.</p>
          <button onClick={onClose} className="px-4 py-2 bg-text text-bg rounded-[var(--radius-xs)] text-sm cursor-pointer border-none">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[600] flex items-start justify-center py-5 px-5 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg rounded-[var(--radius)] w-full max-w-[900px] my-auto overflow-hidden shadow-[var(--shadow-lg)]">
        {/* Header */}
        <div className="bg-accent px-5 py-4 flex justify-between items-center">
          <div>
            <p className="font-bold text-[16px] text-bg">Shortlist Comparison</p>
            <p className="text-bg/70 text-xs mt-0.5">{shortlisted.length} candidates</p>
          </div>
          <button onClick={onClose} className="text-bg/70 hover:text-bg text-xl bg-transparent border-none cursor-pointer">
            ✕
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface2">
                {['Candidate', 'Peter', 'Ossama', 'Combined', 'Verdict', 'Notes'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shortlisted.map(({ candidate, analysis }) => {
                const state = stateMap[candidate.id]
                if (!state) return null
                const ps = state.peter_scores as Scores
                const os = state.ossama_scores as Scores
                const pTotal = Object.values(ps).reduce((a, b) => a + b, 0)
                const oTotal = Object.values(os).reduce((a, b) => a + b, 0)
                const combined = totalScore(ps, os)

                return (
                  <tr key={candidate.id} className="border-t border-border hover:bg-surface2 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-[13px] text-text">{candidate.name}</p>
                      <p className="text-[10px] text-text2 mt-0.5">{analysis?.current_role ?? ''}</p>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[13px] text-purple text-center">
                      {pTotal || '—'}/{max}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[13px] text-blue text-center">
                      {oTotal || '—'}/{max}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[14px] text-green text-center">
                      {combined || '—'}/{max}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {state.verdict && (
                        <span className="text-[11px] font-semibold" style={{ color: VERDICT_COLORS[state.verdict] }}>
                          {VERDICT_LABELS[state.verdict]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-text2 max-w-[180px]">
                      {state.peter_comment && <span>P: {state.peter_comment.slice(0, 50)}</span>}
                      {state.peter_comment && state.ossama_comment && <br />}
                      {state.ossama_comment && <span>O: {state.ossama_comment.slice(0, 50)}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire up the Shortlist button in CardsPage**

In `src/pages/CardsPage.tsx`, add state at the top:
```tsx
const [showShortlist, setShowShortlist] = useState(false)
```

Pass `onShortlistOpen={() => setShowShortlist(true)}` up through `Layout` → `Header`. Since `Layout` already passes `onShortlist` to `Header`, update `Layout.tsx` to pass:
```tsx
<Header
  onShortlist={() => {/* trigger CardsPage shortlist modal */}}
  ...
/>
```

The cleanest approach for now: expose a global callback via a simple context or lift the `showShortlist` state to `Layout`. Add at the bottom of `CardsPage` JSX before the closing `</div>`:
```tsx
{showShortlist && (
  <ShortlistComparison
    candidates={data}
    stateMap={stateMap}
    onClose={() => setShowShortlist(false)}
  />
)}
```

Add a "★ Shortlist" button inside `CardsPage` just above the filter bar (since the header button triggers globally, keep a local trigger here too):
```tsx
<div className="flex justify-end mb-3">
  <button
    onClick={() => setShowShortlist(true)}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all border"
    style={{ background: 'var(--brand-soft)', color: 'var(--brand)', borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)' }}
  >
    ★ Compare Shortlisted ({Object.values(stateMap).filter(s => s.shortlisted === true).length})
  </button>
</div>
```

Import `ShortlistComparison` at the top of `CardsPage.tsx`.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat(cards): add shortlist comparison modal"
```

---

**Phase 4 complete.** The Cards tab is fully functional including the shortlist comparison modal. Proceed to Phase 5: Profile Modal.
