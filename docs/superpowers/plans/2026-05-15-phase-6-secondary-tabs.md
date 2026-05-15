# Phase 6: Secondary Tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Schedule, Compare, Questions, and Salary Chart tabs — all view-only tabs that display existing data with no mutable state except confirmation toggles on the schedule.

**Architecture:** Each page fetches its own data via Supabase queries or reuses existing hooks. Salary parsing (mixed EGP/USD/ambiguous strings) is handled client-side by a utility. Compare selects drive a diff view built from shared `candidate_profiles` and `interview_state` data.

**Tech Stack:** Supabase, Tailwind, shadcn/ui Select component

**Prerequisites:** Phase 4 complete. All candidate data seeded.

---

### Task 1: Schedule Tab

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: Build the SchedulePage**

Replace `src/pages/SchedulePage.tsx`:
```tsx
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'

export function SchedulePage() {
  const { data, loading } = useCandidates()
  const { stateMap, setConfirmed, setInterviewStatus } = useCandidateState()

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>
  }

  const sorted = [...data].sort((a, b) => {
    if (!a.candidate.slot || a.candidate.slot === 'TBD') return 1
    if (!b.candidate.slot || b.candidate.slot === 'TBD') return -1
    return a.candidate.slot.localeCompare(b.candidate.slot)
  })

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Schedule</h1>
      <p className="text-text2 text-[13.5px] mb-6">May 17–21, 2026 · {data.length} interviews</p>

      <div className="overflow-x-auto bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {['#', 'Candidate', 'Slot', 'Type', 'Salary', 'Notice', 'Confirmation', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 bg-surface2 border-b border-border text-[10.5px] font-medium uppercase tracking-[0.08em] text-text3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ candidate }, i) => {
              const state = stateMap[candidate.id]
              if (!state) return null
              return (
                <tr key={candidate.id} className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
                  <td className="px-4 py-3 text-text3 font-mono text-[11px]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text text-[13px]">{candidate.name}</div>
                    <div className="text-text3 text-[11px] font-mono">{candidate.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text2 whitespace-nowrap">
                    {candidate.slot ?? 'TBD'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${candidate.type === 'Remote' ? 'bg-blue-bg text-blue border-blue-line' : 'bg-surface2 text-text2 border-border'}`}>
                      {candidate.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text2 whitespace-nowrap">{candidate.salary ?? '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-text2 whitespace-nowrap">{candidate.notice ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmed(candidate.id, !state.confirmed)}
                      className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-all whitespace-nowrap ${
                        state.confirmed
                          ? 'bg-green-bg text-green border-green-line hover:bg-red-bg hover:text-red hover:border-red-line'
                          : 'bg-amber-bg text-amber border-amber-line hover:bg-amber hover:text-white hover:border-amber'
                      }`}
                    >
                      {state.confirmed ? 'Confirmed' : 'Pending'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={state.interview_status}
                      onChange={(e) => setInterviewStatus(candidate.id, e.target.value as 'pending' | 'in-progress' | 'completed')}
                      className="text-[11.5px] font-sans px-2.5 py-1 rounded-[var(--radius-xs)] border border-border bg-surface text-text cursor-pointer min-w-[120px] outline-none focus:border-text"
                    >
                      <option value="pending">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Done</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**
```bash
npm run dev
```
Navigate to `/schedule`. Expected: Table with all 20 candidates, sortable slots, working confirmation toggles and status selects. Kill the server.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat(schedule): build schedule table tab"
```

---

### Task 2: Compare Tab

**Files:**
- Modify: `src/pages/ComparePage.tsx`
- Create: `src/lib/__tests__/compare.test.ts`

- [ ] **Step 1: Write failing test for compare utility**

Create `src/lib/__tests__/compare.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildCompareRows } from '../compare'

describe('buildCompareRows', () => {
  it('builds a row for each comparison field', () => {
    const rows = buildCompareRows(
      { name: 'Alice', email: 'a@test.com', salary: '100K EGP', notice: '30 days', type: 'In-person', slot: 'Sun 17 May' },
      { name: 'Bob', email: 'b@test.com', salary: '80K EGP', notice: 'Immediate', type: 'Remote', slot: 'Mon 18 May' },
      { fit_score: 70, fit_label: 'Strong', ai_score: 4, b2b_score: 3, fintech_score: 2, seniority_score: 4 },
      { fit_score: 55, fit_label: 'Moderate', ai_score: 2, b2b_score: 4, fintech_score: 5, seniority_score: 3 },
      { peter_scores: { Communication:4,Technical:4,'Culture Fit':4,Leadership:4,Overall:4 }, ossama_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 }, verdict: 'yes' },
      { peter_scores: { Communication:3,Technical:3,'Culture Fit':3,Leadership:3,Overall:3 }, ossama_scores: { Communication:0,Technical:0,'Culture Fit':0,Leadership:0,Overall:0 }, verdict: 'maybe' },
    )
    expect(rows.length).toBeGreaterThan(5)
    const labels = rows.map((r) => r.label)
    expect(labels).toContain('Salary')
    expect(labels).toContain('Fit Score')
    expect(labels).toContain('Verdict')
  })
})
```

- [ ] **Step 2: Implement compare utility**

Create `src/lib/compare.ts`:
```ts
import { totalScore, maxScore } from './scoring'
import type { Scores } from './scoring'

interface CompareRow { label: string; a: string; b: string }

export function buildCompareRows(
  candidateA: { name: string; salary: string | null; notice: string | null; type: string | null; slot: string | null },
  candidateB: { name: string; salary: string | null; notice: string | null; type: string | null; slot: string | null },
  profileA: { fit_score: number | null; fit_label: string | null; ai_score: number | null; b2b_score: number | null; fintech_score: number | null; seniority_score: number | null },
  profileB: { fit_score: number | null; fit_label: string | null; ai_score: number | null; b2b_score: number | null; fintech_score: number | null; seniority_score: number | null },
  stateA: { peter_scores: unknown; ossama_scores: unknown; verdict: string | null },
  stateB: { peter_scores: unknown; ossama_scores: unknown; verdict: string | null },
): CompareRow[] {
  const max = maxScore()
  const scoreA = totalScore(stateA.peter_scores as Scores, stateA.ossama_scores as Scores)
  const scoreB = totalScore(stateB.peter_scores as Scores, stateB.ossama_scores as Scores)

  return [
    { label: 'Slot', a: candidateA.slot ?? '—', b: candidateB.slot ?? '—' },
    { label: 'Type', a: candidateA.type ?? '—', b: candidateB.type ?? '—' },
    { label: 'Salary', a: candidateA.salary ?? '—', b: candidateB.salary ?? '—' },
    { label: 'Notice', a: candidateA.notice ?? '—', b: candidateB.notice ?? '—' },
    { label: 'Fit Score', a: `${profileA.fit_score ?? 0}% — ${profileA.fit_label ?? '—'}`, b: `${profileB.fit_score ?? 0}% — ${profileB.fit_label ?? '—'}` },
    { label: 'AI Score', a: `${profileA.ai_score ?? 0}/5`, b: `${profileB.ai_score ?? 0}/5` },
    { label: 'B2B Score', a: `${profileA.b2b_score ?? 0}/5`, b: `${profileB.b2b_score ?? 0}/5` },
    { label: 'Fintech Score', a: `${profileA.fintech_score ?? 0}/5`, b: `${profileB.fintech_score ?? 0}/5` },
    { label: 'Seniority', a: `${profileA.seniority_score ?? 0}/5`, b: `${profileB.seniority_score ?? 0}/5` },
    { label: 'Combined Score', a: `${scoreA}/${max}`, b: `${scoreB}/${max}` },
    { label: 'Verdict', a: stateA.verdict ?? '—', b: stateB.verdict ?? '—' },
  ]
}
```

- [ ] **Step 3: Run compare tests**
```bash
npm run test:run src/lib/__tests__/compare.test.ts
```
Expected: 1 test passes.

- [ ] **Step 4: Build ComparePage**

Replace `src/pages/ComparePage.tsx`:
```tsx
import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { buildCompareRows } from '@/lib/compare'

export function ComparePage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const [idA, setIdA] = useState<string>('')
  const [idB, setIdB] = useState<string>('')

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>

  const dataA = data.find((d) => d.candidate.id === idA)
  const dataB = data.find((d) => d.candidate.id === idB)
  const stateA = idA ? stateMap[idA] : null
  const stateB = idB ? stateMap[idB] : null

  const rows =
    dataA && dataB && dataA.profile && dataB.profile && stateA && stateB
      ? buildCompareRows(dataA.candidate, dataB.candidate, dataA.profile, dataB.profile, stateA, stateB)
      : []

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Compare</h1>
      <p className="text-text2 text-[13.5px] mb-6">Side-by-side candidate comparison</p>

      {/* Selectors */}
      <div className="bg-surface border border-border rounded-[var(--radius)] p-4 mb-5 flex items-center gap-3 flex-wrap shadow-[var(--shadow-sm)]">
        <p className="text-[13px] text-text2 font-medium">Compare:</p>
        {[{ id: idA, setId: setIdA }, { id: idB, setId: setIdB }].map((sel, i) => (
          <select
            key={i}
            value={sel.id}
            onChange={(e) => sel.setId(e.target.value)}
            className="font-sans text-[11.5px] px-2.5 py-1.5 rounded-[var(--radius-xs)] border border-border bg-surface text-text cursor-pointer min-w-[160px] outline-none focus:border-text"
          >
            <option value="">Select candidate…</option>
            {data.map(({ candidate }) => (
              <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
            ))}
          </select>
        ))}
      </div>

      {!rows.length ? (
        <div className="text-center py-16 text-text3">Select two candidates to compare.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Header */}
          <div className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-5 py-4 bg-surface2 font-medium text-[12px] text-text3 uppercase tracking-[0.04em]">Field</div>
              <div className="px-5 py-4 bg-gradient-to-b from-surface2 to-surface">
                <p className="font-semibold text-[14px] text-text">{dataA!.candidate.name}</p>
                <p className="text-[11px] text-text2 mt-0.5">{dataA!.profile?.title}</p>
              </div>
              <div className="px-5 py-4 bg-gradient-to-b from-surface2 to-surface">
                <p className="font-semibold text-[14px] text-text">{dataB!.candidate.name}</p>
                <p className="text-[11px] text-text2 mt-0.5">{dataB!.profile?.title}</p>
              </div>
            </div>
            {rows.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 divide-x divide-border border-t border-border ${i % 2 === 1 ? 'bg-[color-mix(in_srgb,var(--surface2)_35%,var(--surface))]' : ''}`}>
                <div className="px-5 py-3 text-text2 font-medium text-[11px] uppercase tracking-[0.04em]">{row.label}</div>
                <div className="px-5 py-3 text-[12.5px] text-text">{row.a}</div>
                <div className="px-5 py-3 text-[12.5px] text-text">{row.b}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(compare): build side-by-side candidate comparison tab"
```

---

### Task 3: Questions Tab

**Files:**
- Create: `src/hooks/useInterviewQuestions.ts`
- Modify: `src/pages/QuestionsPage.tsx`

- [ ] **Step 1: Implement useInterviewQuestions**

Create `src/hooks/useInterviewQuestions.ts`:
```ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Question = Database['public']['Tables']['interview_questions']['Row']

export function useInterviewQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('interview_questions')
      .select('*')
      .order('position')
      .then(({ data }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [])

  return { questions, loading }
}
```

- [ ] **Step 2: Build QuestionsPage**

Replace `src/pages/QuestionsPage.tsx`:
```tsx
import { useState } from 'react'
import { useInterviewQuestions } from '@/hooks/useInterviewQuestions'

export function QuestionsPage() {
  const { questions, loading } = useInterviewQuestions()
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]))

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Questions</h1>
      <p className="text-text2 text-[13.5px] mb-6">Interview question bank — {questions.length} sections</p>

      <div className="flex flex-col gap-3">
        {questions.map((section) => {
          const isOpen = expanded.has(section.id)
          return (
            <div key={section.id} className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
              <button
                onClick={() => toggle(section.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface2 transition-colors cursor-pointer"
                style={{ borderLeft: `3px solid ${section.color ?? 'var(--border)'}` }}
              >
                <div>
                  <p className="font-semibold text-[14px] text-text tracking-tight">{section.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {section.duration && <span className="text-[11px] text-text3">⏱ {section.duration}</span>}
                    {section.goal && <span className="text-[11px] text-text3">{section.goal}</span>}
                  </div>
                </div>
                <span className="text-text3 text-xs ml-4">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && section.questions && (
                <div className="border-t border-border divide-y divide-border">
                  {section.questions.map((q, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3 text-[13px]">
                      <span className="font-mono text-[11px] text-text3 mt-0.5 flex-shrink-0">Q{i + 1}</span>
                      <span className="text-text leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat(questions): build expandable interview questions tab"
```

---

### Task 4: Salary Chart Tab

**Files:**
- Create: `src/lib/__tests__/salary.test.ts`
- Create: `src/lib/salary.ts`
- Modify: `src/pages/SalaryPage.tsx`

- [ ] **Step 1: Write failing salary parse tests**

Create `src/lib/__tests__/salary.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseSalaryToEGP, sortBySalary } from '../salary'

describe('parseSalaryToEGP', () => {
  it('parses plain EGP amounts', () => {
    expect(parseSalaryToEGP('115,000 EGP')).toBeCloseTo(115000)
  })

  it('parses K range EGP (uses midpoint)', () => {
    expect(parseSalaryToEGP('85K-100K EGP')).toBeCloseTo(92500)
  })

  it('converts USD/month to EGP using 50 rate', () => {
    expect(parseSalaryToEGP('$3,200/month')).toBeCloseTo(160000)
  })

  it('returns null for TBD', () => {
    expect(parseSalaryToEGP('TBD')).toBeNull()
  })

  it('returns null for unparseable string', () => {
    expect(parseSalaryToEGP('End of June')).toBeNull()
  })
})

describe('sortBySalary', () => {
  it('sorts descending with nulls last', () => {
    const items = [
      { name: 'A', raw: '$3,200/month' },
      { name: 'B', raw: 'TBD' },
      { name: 'C', raw: '115,000 EGP' },
    ]
    const sorted = sortBySalary(items, (i) => i.raw)
    expect(sorted[0].name).toBe('A') // 160K EGP
    expect(sorted[1].name).toBe('C') // 115K EGP
    expect(sorted[2].name).toBe('B') // null last
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/lib/__tests__/salary.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement salary utilities**

Create `src/lib/salary.ts`:
```ts
const USD_TO_EGP = 50 // approximate exchange rate

export function parseSalaryToEGP(raw: string | null | undefined): number | null {
  if (!raw || raw === 'TBD' || raw === '—') return null

  // USD per month: $3,200/month or $3,000-$3,200/month
  const usdMatch = raw.match(/\$([0-9,]+)(?:\s*-\s*\$?([0-9,]+))?/)
  if (usdMatch) {
    const lo = parseFloat(usdMatch[1].replace(/,/g, ''))
    const hi = usdMatch[2] ? parseFloat(usdMatch[2].replace(/,/g, '')) : lo
    return ((lo + hi) / 2) * USD_TO_EGP
  }

  // K range: 85K-100K EGP or 85,000-100,000 EGP
  const kRangeMatch = raw.match(/([0-9]+)[Kk]?\s*-\s*([0-9]+)[Kk]?/)
  if (kRangeMatch) {
    const lo = parseFloat(kRangeMatch[1]) * (raw.toLowerCase().includes('k') ? 1000 : 1)
    const hi = parseFloat(kRangeMatch[2]) * (raw.toLowerCase().includes('k') ? 1000 : 1)
    return (lo + hi) / 2
  }

  // Plain number with EGP
  const plainMatch = raw.match(/([0-9][0-9,]*)\s*(?:EGP|egp)?/)
  if (plainMatch) {
    const val = parseFloat(plainMatch[1].replace(/,/g, ''))
    if (val > 100) return val // sanity: must be > 100 to be a valid salary
  }

  return null
}

export function sortBySalary<T>(items: T[], getRaw: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const va = parseSalaryToEGP(getRaw(a))
    const vb = parseSalaryToEGP(getRaw(b))
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    return vb - va
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/lib/__tests__/salary.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 5: Build SalaryPage**

Replace `src/pages/SalaryPage.tsx`:
```tsx
import { useCandidates } from '@/hooks/useCandidates'
import { parseSalaryToEGP, sortBySalary } from '@/lib/salary'

export function SalaryPage() {
  const { data, loading } = useCandidates()

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>

  const sorted = sortBySalary(
    data.map((d) => ({ candidate: d.candidate, parsed: parseSalaryToEGP(d.candidate.salary) })),
    (item) => item.candidate.salary,
  )

  const maxVal = Math.max(...sorted.map((s) => s.parsed ?? 0), 1)

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Salary Chart</h1>
      <p className="text-text2 text-[13.5px] mb-6">All values normalized to EGP equivalent (USD × 50). TBD excluded from ranking.</p>

      <div className="bg-surface border border-border rounded-[var(--radius)] p-6 shadow-[var(--shadow-sm)]">
        {sorted.map(({ candidate, parsed }, i) => {
          const pct = parsed ? Math.round((parsed / maxVal) * 100) : 0
          const colors = ['var(--green)', 'var(--blue)', 'var(--brand)', 'var(--purple)', 'var(--amber)']
          const color = colors[i % colors.length]

          return (
            <div key={candidate.id} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[11.5px] text-text w-44 flex-shrink-0 truncate font-medium">{candidate.name}</span>
              <div className="flex-1 h-5 bg-surface2 rounded-[6px] overflow-hidden relative border border-border">
                {parsed ? (
                  <>
                    <div
                      className="h-full rounded-[5px] transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10.5px] font-semibold font-mono text-text2">
                      {candidate.salary}
                    </span>
                  </>
                ) : (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10.5px] text-text3">
                    {candidate.salary}
                  </span>
                )}
              </div>
              {parsed && (
                <span className="text-[10.5px] font-mono text-text3 w-24 text-right flex-shrink-0">
                  ~{Math.round(parsed / 1000)}K EGP
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**
```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(salary): build salary chart tab with EGP normalization"
```

---

**Phase 6 complete.** All four secondary tabs are functional. Proceed to Phase 7: Day Briefing & Analysis.
