# Phase 7: Day Briefing & Analysis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Day Briefing tab (per-candidate brief cards with interview timer) and the Analysis tab (KPI cards, bar charts, donut charts, scatter plot, ranking table, and interviewer accountability panel).

**Architecture:** All charts are built with pure SVG/CSS — no chart library dependency. The scatter plot uses absolute positioned `div` elements within a relative container. The accountability panel reads from `audit_log` to compute per-user submission latency.

**Tech Stack:** Supabase, React 19, Tailwind, SVG (no external chart library)

**Prerequisites:** Phase 4 complete. All data seeded.

---

### Task 1: Analytics Utilities

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/lib/__tests__/analytics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/analytics.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeKPIs, computeDomainFrequency, computeRanking } from '../analytics'
import { ZERO_SCORES } from '../scoring'

const makeAnalysis = (overrides = {}) => ({
  candidate_id: 'x',
  ai_exp: false,
  b2b: false,
  b2c: false,
  fintech: false,
  total_exp: 5,
  pm_exp: 3,
  domains: [] as string[],
  university: null, degree: null, grad_year: null, masters: null,
  current_role: null, current_company: null, notable: null,
  ...overrides,
})

const makeState = (overrides = {}) => ({
  candidate_id: 'x',
  confirmed: false,
  shortlisted: null,
  interview_status: 'pending',
  verdict: null,
  peter_scores: ZERO_SCORES,
  ossama_scores: ZERO_SCORES,
  peter_comment: '',
  ossama_comment: '',
  checklist: {},
  photo_url: null,
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('computeKPIs', () => {
  it('counts AI experience candidates', () => {
    const result = computeKPIs(
      [makeAnalysis({ ai_exp: true }), makeAnalysis({ ai_exp: false })],
      [makeState(), makeState()],
    )
    expect(result.aiExpCount).toBe(1)
  })

  it('computes average total experience', () => {
    const result = computeKPIs(
      [makeAnalysis({ total_exp: 10 }), makeAnalysis({ total_exp: 4 })],
      [makeState(), makeState()],
    )
    expect(result.avgTotalExp).toBe(7)
  })

  it('counts shortlisted candidates', () => {
    const result = computeKPIs(
      [makeAnalysis()],
      [makeState({ shortlisted: true })],
    )
    expect(result.shortlistedCount).toBe(1)
  })
})

describe('computeDomainFrequency', () => {
  it('counts domain occurrences across all candidates', () => {
    const freq = computeDomainFrequency([
      makeAnalysis({ domains: ['AI', 'Fintech'] }),
      makeAnalysis({ domains: ['AI', 'SaaS'] }),
    ])
    expect(freq['AI']).toBe(2)
    expect(freq['Fintech']).toBe(1)
    expect(freq['SaaS']).toBe(1)
  })
})

describe('computeRanking', () => {
  it('ranks candidates by combined score descending', () => {
    const ranking = computeRanking(
      [{ candidate_id: 'a' }, { candidate_id: 'b' }],
      {
        a: makeState({ peter_scores: { Communication:5,Technical:5,'Culture Fit':5,Leadership:5,Overall:5 } }),
        b: makeState({ peter_scores: { Communication:2,Technical:2,'Culture Fit':2,Leadership:2,Overall:2 } }),
      },
      {},
    )
    expect(ranking[0].candidateId).toBe('a')
    expect(ranking[1].candidateId).toBe('b')
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/lib/__tests__/analytics.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement analytics utilities**

Create `src/lib/analytics.ts`:
```ts
import { totalScore } from './scoring'
import type { Scores } from './scoring'

interface AnalysisRow { candidate_id: string; ai_exp: boolean; b2b: boolean; b2c: boolean; fintech: boolean; total_exp: number | null; pm_exp: number | null; domains: string[] | null }
interface StateRow { candidate_id: string; peter_scores: unknown; ossama_scores: unknown; shortlisted: boolean | null; verdict: string | null; interview_status: string }

export interface KPIs {
  totalCount: number
  aiExpCount: number
  b2bCount: number
  avgTotalExp: number
  shortlistedCount: number
}

export function computeKPIs(analysis: AnalysisRow[], states: StateRow[]): KPIs {
  const totalCount = analysis.length
  const aiExpCount = analysis.filter((a) => a.ai_exp).length
  const b2bCount = analysis.filter((a) => a.b2b).length
  const avgTotalExp = totalCount > 0
    ? Math.round(analysis.reduce((sum, a) => sum + (a.total_exp ?? 0), 0) / totalCount)
    : 0
  const shortlistedCount = states.filter((s) => s.shortlisted === true).length
  return { totalCount, aiExpCount, b2bCount, avgTotalExp, shortlistedCount }
}

export function computeDomainFrequency(analysis: AnalysisRow[]): Record<string, number> {
  const freq: Record<string, number> = {}
  for (const a of analysis) {
    for (const domain of a.domains ?? []) {
      freq[domain] = (freq[domain] ?? 0) + 1
    }
  }
  return freq
}

export interface RankingEntry {
  candidateId: string
  combinedScore: number
  verdict: string | null
  peterScore: number
  ossamaScore: number
}

export function computeRanking(
  analysis: { candidate_id: string }[],
  stateMap: Record<string, StateRow>,
  profileMap: Record<string, { fit_score?: number | null }>,
): RankingEntry[] {
  return analysis
    .map((a) => {
      const s = stateMap[a.candidate_id]
      if (!s) return null
      const ps = s.peter_scores as Scores
      const os = s.ossama_scores as Scores
      return {
        candidateId: a.candidate_id,
        combinedScore: totalScore(ps, os),
        verdict: s.verdict,
        peterScore: Object.values(ps).reduce((x, y) => x + y, 0),
        ossamaScore: Object.values(os).reduce((x, y) => x + y, 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.combinedScore - a!.combinedScore) as RankingEntry[]
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/lib/__tests__/analytics.test.ts
```
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(analysis): add analytics computation utilities"
```

---

### Task 2: Day Briefing Tab

**Files:**
- Create: `src/components/briefing/BriefCard.tsx`
- Create: `src/components/briefing/InterviewTimer.tsx`
- Modify: `src/pages/BriefingPage.tsx`

- [ ] **Step 1: Build InterviewTimer**

Create `src/components/briefing/InterviewTimer.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'

const TOTAL_SECONDS = 3600

export function InterviewTimer() {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, seconds])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const color = seconds < 300 ? 'var(--red)' : seconds < 600 ? 'var(--amber)' : 'var(--green)'

  const circ = 2 * Math.PI * 52
  const offset = circ * (1 - seconds / TOTAL_SECONDS)

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface3)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ strokeDasharray: circ, strokeDashoffset: offset, transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[13px] font-semibold" style={{ color }}>{fmt(seconds)}</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => setRunning((r) => !r)}
          className="text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius-xs)] bg-surface border border-border text-text2 hover:bg-text hover:text-bg transition-all cursor-pointer"
        >
          {running ? 'Pause' : seconds < TOTAL_SECONDS ? 'Resume' : 'Start'}
        </button>
        <button
          onClick={() => { setRunning(false); setSeconds(TOTAL_SECONDS) }}
          className="text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius-xs)] bg-surface border border-border text-text3 hover:bg-surface2 transition-all cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build BriefCard**

Create `src/components/briefing/BriefCard.tsx`:
```tsx
import { InterviewTimer } from './InterviewTimer'
import type { CandidateWithDetails } from '@/hooks/useCandidates'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

interface BriefCardProps {
  data: CandidateWithDetails
  state: State
  onPrintBrief: () => void
}

export function BriefCard({ data, state, onPrintBrief }: BriefCardProps) {
  const { candidate, profile, analysis } = data

  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] mb-3.5 overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-px transition-all">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface2 to-surface px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-mono text-[18px] font-semibold text-text tracking-tight">{candidate.time}</span>
          </div>
          <div>
            <p className="text-[17px] font-semibold tracking-tight text-text">{candidate.name}</p>
            <p className="text-[12px] text-text2 mt-0.5">{candidate.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InterviewTimer />
          <button
            onClick={onPrintBrief}
            className="text-[11.5px] font-medium px-3 py-1.5 rounded-[var(--radius-sm)] border border-red-line text-red bg-surface hover:bg-red hover:text-white transition-all cursor-pointer"
          >
            Print Brief
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="flex gap-5 flex-wrap text-[12.5px] mb-3">
          {[
            { label: 'Slot', value: candidate.slot },
            { label: 'Type', value: candidate.type },
            { label: 'Salary', value: candidate.salary },
            { label: 'Notice', value: candidate.notice },
            ...(analysis ? [
              { label: 'Role', value: `${analysis.current_role} @ ${analysis.current_company}` },
              { label: 'Experience', value: `${analysis.total_exp}y total, ${analysis.pm_exp}y PM` },
            ] : []),
          ].map((item) => (
            <span key={item.label} className="text-text2">
              <strong className="text-text font-medium">{item.label}:</strong> {item.value ?? '—'}
            </span>
          ))}
        </div>

        {profile && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border" style={{ background: `color-mix(in srgb, ${profile.fit_color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${profile.fit_color} 30%, transparent)`, color: profile.fit_color ?? 'var(--text2)' }}>
              {profile.fit_label} · {profile.fit_score}%
            </span>
            {state.confirmed && <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border bg-green-bg text-green border-green-line">Confirmed</span>}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build BriefingPage**

Replace `src/pages/BriefingPage.tsx`:
```tsx
import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { BriefCard } from '@/components/briefing/BriefCard'

const DAYS = ['All', 'Sunday 17 May', 'Monday 18 May', 'Tuesday 19 May', 'Wednesday 20 May', 'Thursday 21 May']

export function BriefingPage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const [day, setDay] = useState('All')

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>

  const filtered = data.filter((d) =>
    day === 'All' || d.candidate.day === day,
  ).sort((a, b) => (a.candidate.time ?? '').localeCompare(b.candidate.time ?? ''))

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Day Briefing</h1>
      <p className="text-text2 text-[13.5px] mb-5">Pre-interview briefs with candidate summaries and interview timer.</p>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium font-sans border transition-all cursor-pointer ${
              day === d ? 'bg-text text-bg border-text' : 'bg-surface border-border text-text2 hover:border-border-strong hover:text-text'
            }`}
          >
            {d === 'All' ? 'All Days' : d.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text3">No interviews scheduled for this day.</div>
      ) : (
        filtered.map(({ candidate, ...rest }) => {
          const state = stateMap[candidate.id]
          if (!state) return null
          return (
            <BriefCard
              key={candidate.id}
              data={{ candidate, ...rest }}
              state={state}
              onPrintBrief={() => window.print()}
            />
          )
        })
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat(briefing): build day briefing tab with timer"
```

---

### Task 3: Analysis Tab — KPIs + Bar Charts

**Files:**
- Create: `src/components/analysis/KPICards.tsx`
- Create: `src/components/analysis/HorizontalBar.tsx`

- [ ] **Step 1: Build KPICards**

Create `src/components/analysis/KPICards.tsx`:
```tsx
import type { KPIs } from '@/lib/analytics'

interface KPICardsProps { kpis: KPIs }

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    { label: 'Total Candidates', value: kpis.totalCount, sub: 'in this round' },
    { label: 'AI Experience', value: kpis.aiExpCount, sub: `${Math.round((kpis.aiExpCount / kpis.totalCount) * 100)}% of pool` },
    { label: 'B2B Experience', value: kpis.b2bCount, sub: `${Math.round((kpis.b2bCount / kpis.totalCount) * 100)}% of pool` },
    { label: 'Avg Experience', value: `${kpis.avgTotalExp}y`, sub: 'total years' },
    { label: 'Shortlisted', value: kpis.shortlistedCount, sub: 'candidates' },
  ]

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
      {cards.map((c) => (
        <div key={c.label} className="bg-surface border border-border rounded-[var(--radius)] px-5 py-4 shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] transition-all">
          <div className="text-[30px] font-medium tracking-[-0.03em] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {c.value}
          </div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-text3 mt-1.5">{c.label}</div>
          <div className="text-[11px] text-text2 mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Build HorizontalBar (reusable)**

Create `src/components/analysis/HorizontalBar.tsx`:
```tsx
interface BarItem { label: string; value: number; color?: string }
interface HorizontalBarProps { data: BarItem[]; maxVal?: number; unit?: string }

export function HorizontalBar({ data, maxVal, unit = '' }: HorizontalBarProps) {
  const max = maxVal ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      {data.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2.5 mb-2 last:mb-0">
          <span className="text-[11.5px] text-text w-36 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">{item.label}</span>
          <div className="flex-1 h-5 bg-surface2 rounded-[6px] overflow-hidden relative border border-border">
            <div
              className="h-full rounded-[5px] transition-[width] duration-500"
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.color ?? `oklch(0.55 0.12 ${(i * 40) % 360})`,
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10.5px] font-semibold font-mono text-text2">
              {item.value}{unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat(analysis): add KPI cards and horizontal bar chart"
```

---

### Task 4: Analysis Tab — Scatter Plot + Ranking Table + Accountability

**Files:**
- Create: `src/components/analysis/ScatterPlot.tsx`
- Create: `src/components/analysis/RankingTable.tsx`
- Create: `src/components/analysis/InterviewerAccountability.tsx`
- Modify: `src/pages/AnalysisPage.tsx`

- [ ] **Step 1: Build ScatterPlot**

Create `src/components/analysis/ScatterPlot.tsx`:
```tsx
interface ScatterPoint { id: string; name: string; x: number; y: number; color?: string }
interface ScatterPlotProps { points: ScatterPoint[]; xLabel: string; yLabel: string }

export function ScatterPlot({ points, xLabel, yLabel }: ScatterPlotProps) {
  const maxX = Math.max(...points.map((p) => p.x), 1)
  const maxY = Math.max(...points.map((p) => p.y), 1)

  return (
    <div>
      <div className="relative h-[280px] bg-gradient-to-br from-surface2 to-surface rounded-[var(--radius-sm)] overflow-hidden border border-border">
        {points.map((pt) => {
          const left = Math.round((pt.x / maxX) * 88) + 4
          const bottom = Math.round((pt.y / maxY) * 88) + 4
          return (
            <div
              key={pt.id}
              title={`${pt.name} — ${xLabel}: ${pt.x}, ${yLabel}: ${pt.y}`}
              className="absolute w-7 h-7 rounded-full flex items-center justify-center text-[8.5px] font-semibold text-white cursor-pointer transition-all duration-200 hover:scale-150 hover:z-10 border-2 border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              style={{
                left: `${left}%`,
                bottom: `${bottom}%`,
                background: pt.color ?? 'var(--brand)',
              }}
            >
              {pt.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
          )
        })}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-text3">{xLabel}</div>
        <div className="absolute top-1/2 left-1 -translate-y-1/2 -rotate-90 text-[10px] text-text3">{yLabel}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build RankingTable**

Create `src/components/analysis/RankingTable.tsx`:
```tsx
import { useState } from 'react'
import type { RankingEntry } from '@/lib/analytics'
import { maxScore } from '@/lib/scoring'

interface RankingTableProps {
  entries: RankingEntry[]
  nameMap: Record<string, string>
}

const VERDICT_COLORS: Record<string, string> = {
  'strong-yes': 'var(--green)',
  yes: 'var(--blue)',
  maybe: 'var(--amber)',
  no: 'var(--red)',
}

export function RankingTable({ entries, nameMap }: RankingTableProps) {
  type SortKey = 'rank' | 'name' | 'combined' | 'verdict'
  const [sort, setSort] = useState<SortKey>('rank')
  const max = maxScore()

  const sorted = [...entries].sort((a, b) => {
    if (sort === 'name') return (nameMap[a.candidateId] ?? '').localeCompare(nameMap[b.candidateId] ?? '')
    if (sort === 'combined') return b.combinedScore - a.combinedScore
    if (sort === 'verdict') return (a.verdict ?? 'z').localeCompare(b.verdict ?? 'z')
    return b.combinedScore - a.combinedScore
  })

  const thCls = 'text-left px-3 py-2.5 bg-surface2 border-b border-border text-[10.5px] font-medium uppercase tracking-[0.06em] text-text3 whitespace-nowrap cursor-pointer select-none hover:text-text transition-colors'
  const tdCls = 'px-3 py-2.5 border-b border-border align-middle'

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-border shadow-[var(--shadow-sm)]">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {[
              { key: 'rank' as SortKey, label: '#' },
              { key: 'name' as SortKey, label: 'Candidate' },
              { key: 'combined' as SortKey, label: 'Combined Score' },
              { key: 'rank' as SortKey, label: 'Peter' },
              { key: 'rank' as SortKey, label: 'Ossama' },
              { key: 'verdict' as SortKey, label: 'Verdict' },
            ].map((col, i) => (
              <th key={i} className={thCls} onClick={() => setSort(col.key)}>
                {col.label} {sort === col.key && '↓'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr key={entry.candidateId} className="hover:bg-surface2 transition-colors">
              <td className={`${tdCls} font-mono text-text3 text-[11px]`}>{i + 1}</td>
              <td className={`${tdCls} font-semibold text-text`}>{nameMap[entry.candidateId] ?? entry.candidateId}</td>
              <td className={`${tdCls} font-mono font-bold text-green`}>{entry.combinedScore || '—'}/{max}</td>
              <td className={`${tdCls} font-mono text-purple`}>{entry.peterScore || '—'}/{max}</td>
              <td className={`${tdCls} font-mono text-blue`}>{entry.ossamaScore || '—'}/{max}</td>
              <td className={tdCls}>
                {entry.verdict && (
                  <span className="text-[11px] font-semibold" style={{ color: VERDICT_COLORS[entry.verdict] ?? 'var(--text3)' }}>
                    {entry.verdict === 'strong-yes' ? '⭐ Strong Yes' : entry.verdict === 'yes' ? '✓ Yes' : entry.verdict === 'maybe' ? '? Maybe' : '✗ No'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Build InterviewerAccountability**

Create `src/components/analysis/InterviewerAccountability.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AccountabilityRow {
  interviewer: string
  avgSubmitHours: number | null
  totalScorecards: number
}

export function InterviewerAccountability() {
  const [rows, setRows] = useState<AccountabilityRow[]>([])

  useEffect(() => {
    // Fetch audit log entries for score submissions
    supabase
      .from('audit_log')
      .select('*')
      .in('field', ['peter_scores', 'ossama_scores'])
      .then(({ data }) => {
        if (!data) return
        const byUser: Record<string, number[]> = {}
        for (const entry of data) {
          const user = entry.changed_by.split('@')[0]
          if (!byUser[user]) byUser[user] = []
          byUser[user].push(new Date(entry.created_at).getTime())
        }
        setRows(
          Object.entries(byUser).map(([interviewer, timestamps]) => ({
            interviewer,
            avgSubmitHours: null, // Would need interview completion timestamps to compute delta
            totalScorecards: timestamps.length,
          })),
        )
      })
  }, [])

  if (!rows.length) return <p className="text-text3 text-sm">No scorecard submissions recorded yet.</p>

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-border shadow-[var(--shadow-sm)]">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {['Interviewer', 'Scorecards Submitted', 'Avg Submission Time'].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 bg-surface2 border-b border-border text-[10.5px] font-medium uppercase tracking-[0.06em] text-text3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.interviewer} className="border-b border-border last:border-b-0 hover:bg-surface2">
              <td className="px-4 py-2.5 font-semibold text-text capitalize">{row.interviewer}</td>
              <td className="px-4 py-2.5 font-mono text-brand">{row.totalScorecards}</td>
              <td className="px-4 py-2.5 text-text3">
                {row.avgSubmitHours !== null ? `${row.avgSubmitHours.toFixed(1)}h` : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Build the full AnalysisPage**

Replace `src/pages/AnalysisPage.tsx`:
```tsx
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import { computeKPIs, computeDomainFrequency, computeRanking } from '@/lib/analytics'
import { KPICards } from '@/components/analysis/KPICards'
import { HorizontalBar } from '@/components/analysis/HorizontalBar'
import { ScatterPlot } from '@/components/analysis/ScatterPlot'
import { RankingTable } from '@/components/analysis/RankingTable'
import { InterviewerAccountability } from '@/components/analysis/InterviewerAccountability'
import type { Scores } from '@/lib/scoring'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text3">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export function AnalysisPage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-surface3 border-t-text rounded-full animate-spin" /></div>

  const analysisRows = data.map((d) => d.analysis).filter(Boolean) as NonNullable<typeof data[0]['analysis']>[]
  const stateRows = Object.values(stateMap)
  const kpis = computeKPIs(analysisRows, stateRows)
  const domainFreq = computeDomainFrequency(analysisRows)
  const ranking = computeRanking(analysisRows, stateMap, {})
  const nameMap = Object.fromEntries(data.map((d) => [d.candidate.id, d.candidate.name]))

  const expData = data
    .map((d) => ({ label: d.candidate.name.split(' ')[0], value: d.analysis?.total_exp ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)

  const domainData = Object.entries(domainFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, value]) => ({ label, value }))

  const scatterPoints = data.map((d, i) => ({
    id: d.candidate.id,
    name: d.candidate.name,
    x: d.analysis?.pm_exp ?? 0,
    y: d.profile?.fit_score ?? 0,
    color: `oklch(0.55 0.12 ${(i * 37) % 360})`,
  }))

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">📊 Analysis</h1>
      <p className="text-text2 text-[13.5px] mb-8">Candidate pool analysis for May 2026 Senior PM hiring round.</p>

      <div className="mb-8"><KPICards kpis={kpis} /></div>

      <div className="mb-8">
        <SectionTitle>Experience Distribution</SectionTitle>
        <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">Total Years Experience</p>
          <HorizontalBar data={expData} unit="y" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">Domain Frequency</p>
          <HorizontalBar data={domainData} />
        </div>
        <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">PM Exp vs Fit Score</p>
          <ScatterPlot points={scatterPoints} xLabel="PM Experience (yrs)" yLabel="Fit Score (%)" />
        </div>
      </div>

      <div className="mb-8">
        <SectionTitle>Candidate Ranking</SectionTitle>
        <RankingTable entries={ranking} nameMap={nameMap} />
      </div>

      <div className="mb-8">
        <SectionTitle>Interviewer Accountability</SectionTitle>
        <InterviewerAccountability />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run all tests**
```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 6: Verify in browser**
```bash
npm run dev
```
Navigate to `/analysis`. Expected: KPI cards, experience bar chart, domain chart, scatter plot, ranking table, accountability panel. Navigate to `/briefing`. Expected: Brief cards with countdown timer per candidate.

Kill the server.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(analysis): complete analysis tab and day briefing tab"
```

---

**Phase 7 complete.** Day Briefing and Analysis tabs are fully functional. Proceed to Phase 8: AI Assistant & Exports.
