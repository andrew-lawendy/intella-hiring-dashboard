# Phase 1 — Analysis Page Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add seven missing sections to the Analysis page — PM exp bars, salary comparison, education charts, domain coverage donuts, domain heatmap, expandable ranking cards, full comparison table, and key highlights.

**Architecture:** New compute functions added to `src/lib/analytics.ts`. New reusable chart components (`DonutChart`, `DomainHeatmap`) added to `src/components/analysis/`. The existing `RankingTable` is replaced with an `ExpandableRankingCard` list. `AnalysisPage.tsx` composes all sections. No external chart libraries — SVG for donuts, Tailwind CSS for all other visuals.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, existing `HorizontalBar`, `DataTable`, `useCandidates` hook, `salaryToEGP` from `src/lib/salary.ts`.

---

## File Map

| File                                                | Action | Responsibility                                 |
| --------------------------------------------------- | ------ | ---------------------------------------------- |
| `src/lib/analytics.ts`                              | Modify | Add 6 new compute functions                    |
| `src/components/analysis/DonutChart.tsx`            | Create | Reusable SVG donut chart                       |
| `src/components/analysis/DomainHeatmap.tsx`         | Create | Candidate × domain grid                        |
| `src/components/analysis/ExpandableRankingCard.tsx` | Create | Clickable ranking cards replacing RankingTable |
| `src/components/analysis/ComparisonTable.tsx`       | Create | Full data table of all candidates              |
| `src/components/analysis/KeyHighlights.tsx`         | Create | Computed highlight callout cards               |
| `src/pages/AnalysisPage.tsx`                        | Modify | Compose all new sections                       |

---

### Task 1: New compute functions in `analytics.ts`

**Files:**

- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Add the six new functions at the bottom of the file**

```typescript
// ── Types used by new sections ──────────────────────────────────────────────

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export interface HeatmapData {
  candidateNames: string[]
  domains: string[]
  /** grid[candidateIndex][domainIndex] = true if covered */
  grid: boolean[][]
}

export interface ComparisonRow {
  id: string
  name: string
  fitScore: number | null
  pmExp: number | null
  totalExp: number | null
  aiExp: boolean
  fintech: boolean
  b2b: boolean
  b2c: boolean
  university: string | null
  gradYear: number | null
  masters: boolean
  salaryAmount: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  notice: string | null
  seniority: string | null
  verdict: string | null
}

export interface Highlight {
  title: string
  value: string
  sub?: string
}

// ── PM Experience bars ───────────────────────────────────────────────────────

export function computePmExpBars(
  data: { candidate: { name: string }; analysis: { pm_exp: number | null } | null }[],
): { label: string; value: number; color: string }[] {
  return data
    .map((d) => ({
      label: d.candidate.name.split(' ')[0],
      value: d.analysis?.pm_exp ?? 0,
      color:
        (d.analysis?.pm_exp ?? 0) >= 8
          ? 'var(--purple)'
          : (d.analysis?.pm_exp ?? 0) >= 5
            ? 'var(--blue)'
            : (d.analysis?.pm_exp ?? 0) >= 3
              ? 'var(--amber)'
              : 'var(--text3)',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)
}

// ── Salary comparison bars ───────────────────────────────────────────────────

export function computeSalaryBars(
  data: {
    candidate: {
      name: string
      salary_amount: number | null
      salary_currency: string | null
      salary_period: string | null
    }
  }[],
  salaryToEGP: (a: number | null, c: string | null, p: string | null) => number | null,
): { label: string; value: number; color: string }[] {
  const items = data
    .map((d) => ({
      label: d.candidate.name.split(' ')[0],
      value:
        salaryToEGP(
          d.candidate.salary_amount,
          d.candidate.salary_currency,
          d.candidate.salary_period,
        ) ?? 0,
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)

  const max = items[0]?.value ?? 1
  return items.map((x) => ({
    ...x,
    color:
      x.value >= max * 0.8 ? 'var(--red)' : x.value >= max * 0.5 ? 'var(--blue)' : 'var(--green)',
  }))
}

// ── Education data ───────────────────────────────────────────────────────────

export function computeEducationData(
  data: {
    candidate: { name: string }
    analysis: { degree: string | null; grad_year: number | null } | null
  }[],
): { degreeSlices: DonutSlice[]; gradYearBars: { label: string; value: number; color: string }[] } {
  const DEGREE_COLORS: Record<string, string> = {
    BSc: 'var(--blue)',
    BEng: 'var(--purple)',
    BA: 'var(--amber)',
    Masters: 'var(--green)',
    Other: 'var(--text3)',
  }

  const degreeCounts: Record<string, number> = {}
  for (const d of data) {
    const deg = d.analysis?.degree ?? ''
    const key =
      deg.toLowerCase().includes('master') || deg.toLowerCase().includes('msc')
        ? 'Masters'
        : deg.toLowerCase().includes('bsc') || deg.toLowerCase().includes('b.sc')
          ? 'BSc'
          : deg.toLowerCase().includes('beng') || deg.toLowerCase().includes('b.eng')
            ? 'BEng'
            : deg.toLowerCase().includes('ba') || deg.toLowerCase().includes('b.a')
              ? 'BA'
              : deg
                ? 'Other'
                : 'Unknown'
    degreeCounts[key] = (degreeCounts[key] ?? 0) + 1
  }

  const degreeSlices: DonutSlice[] = Object.entries(degreeCounts)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value, color: DEGREE_COLORS[label] ?? 'var(--text3)' }))

  const gradYearBars = data
    .filter((d) => d.analysis?.grad_year != null)
    .map((d) => ({
      label: d.candidate.name.split(' ')[0],
      value: d.analysis!.grad_year!,
      color:
        d.analysis!.grad_year! >= 2020
          ? 'var(--blue)'
          : d.analysis!.grad_year! >= 2016
            ? 'var(--amber)'
            : 'var(--text3)',
    }))
    .sort((a, b) => b.value - a.value)

  return { degreeSlices, gradYearBars }
}

// ── Domain coverage donuts ───────────────────────────────────────────────────

export function computeDomainCoverage(
  analysis: { ai_exp: boolean; b2b: boolean; b2c: boolean; fintech: boolean }[],
): { ai: DonutSlice[]; fintech: DonutSlice[]; b2bB2c: DonutSlice[] } {
  const total = analysis.length || 1
  const aiYes = analysis.filter((a) => a.ai_exp).length
  const finYes = analysis.filter((a) => a.fintech).length
  const b2bOnly = analysis.filter((a) => a.b2b && !a.b2c).length
  const b2cOnly = analysis.filter((a) => a.b2c && !a.b2b).length
  const both = analysis.filter((a) => a.b2b && a.b2c).length
  const neither = total - b2bOnly - b2cOnly - both

  return {
    ai: [
      { label: 'Has AI/ML exp', value: aiYes, color: 'var(--green)' },
      { label: 'No AI/ML exp', value: total - aiYes, color: 'var(--border)' },
    ],
    fintech: [
      { label: 'Has Fintech exp', value: finYes, color: 'var(--purple)' },
      { label: 'No Fintech exp', value: total - finYes, color: 'var(--border)' },
    ],
    b2bB2c: [
      { label: 'B2B only', value: b2bOnly, color: 'var(--blue)' },
      { label: 'B2C only', value: b2cOnly, color: 'var(--amber)' },
      { label: 'Both', value: both, color: 'var(--green)' },
      { label: 'Neither', value: neither, color: 'var(--border)' },
    ],
  }
}

// ── Domain heatmap ───────────────────────────────────────────────────────────

export function computeHeatmap(
  data: {
    candidate: { name: string }
    analysis: { domains: string[] | null } | null
  }[],
): HeatmapData {
  const domainSet = new Set<string>()
  for (const d of data) for (const dom of d.analysis?.domains ?? []) domainSet.add(dom)
  const domains = Array.from(domainSet).sort()

  return {
    candidateNames: data.map((d) => d.candidate.name.split(' ')[0]),
    domains,
    grid: data.map((d) => domains.map((dom) => (d.analysis?.domains ?? []).includes(dom))),
  }
}

// ── Comparison table rows ────────────────────────────────────────────────────

export function computeComparisonRows(
  data: {
    candidate: {
      id: string
      name: string
      salary_amount: number | null
      salary_currency: string | null
      salary_period: string | null
      notice: string | null
      seniority: string | null
    }
    profile: { fit_score: number | null } | null
    analysis: {
      pm_exp: number | null
      total_exp: number | null
      ai_exp: boolean
      fintech: boolean
      b2b: boolean
      b2c: boolean
      university: string | null
      grad_year: number | null
      masters: string | null
    } | null
  }[],
  stateMap: Record<string, { verdict: string | null }>,
): ComparisonRow[] {
  return data
    .map((d) => ({
      id: d.candidate.id,
      name: d.candidate.name,
      fitScore: d.profile?.fit_score ?? null,
      pmExp: d.analysis?.pm_exp ?? null,
      totalExp: d.analysis?.total_exp ?? null,
      aiExp: d.analysis?.ai_exp ?? false,
      fintech: d.analysis?.fintech ?? false,
      b2b: d.analysis?.b2b ?? false,
      b2c: d.analysis?.b2c ?? false,
      university: d.analysis?.university ?? null,
      gradYear: d.analysis?.grad_year ?? null,
      masters: d.analysis?.masters === 'true',
      salaryAmount: d.candidate.salary_amount,
      salaryCurrency: d.candidate.salary_currency,
      salaryPeriod: d.candidate.salary_period,
      notice: d.candidate.notice,
      seniority: d.candidate.seniority,
      verdict: stateMap[d.candidate.id]?.verdict ?? null,
    }))
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
}

// ── Key highlights ───────────────────────────────────────────────────────────

export function computeKeyHighlights(
  data: {
    candidate: {
      name: string
      notice: string | null
      salary_amount: number | null
      salary_currency: string | null
      salary_period: string | null
    }
    profile: { fit_score: number | null } | null
    analysis: {
      pm_exp: number | null
      total_exp: number | null
      ai_exp: boolean
    } | null
  }[],
  salaryToEGP: (a: number | null, c: string | null, p: string | null) => number | null,
): Highlight[] {
  const highlights: Highlight[] = []

  const byFit = [...data].sort((a, b) => (b.profile?.fit_score ?? 0) - (a.profile?.fit_score ?? 0))
  if (byFit[0]) {
    highlights.push({
      title: '🏆 Highest fit score',
      value: byFit[0].candidate.name,
      sub: `${byFit[0].profile?.fit_score ?? 0}% fit`,
    })
  }

  const byPmExp = [...data].sort((a, b) => (b.analysis?.pm_exp ?? 0) - (a.analysis?.pm_exp ?? 0))
  if (byPmExp[0] && (byPmExp[0].analysis?.pm_exp ?? 0) > 0) {
    highlights.push({
      title: '💼 Most PM experience',
      value: byPmExp[0].candidate.name,
      sub: `${byPmExp[0].analysis!.pm_exp} years in PM`,
    })
  }

  const aiCandidates = data.filter((d) => d.analysis?.ai_exp)
  highlights.push({
    title: '🤖 AI/ML experience',
    value: `${aiCandidates.length} of ${data.length} candidates`,
    sub: aiCandidates.map((d) => d.candidate.name.split(' ')[0]).join(', ') || 'None',
  })

  const immediate = data.filter((d) => d.candidate.notice?.toLowerCase() === 'immediate')
  if (immediate.length > 0) {
    highlights.push({
      title: '⚡ Available immediately',
      value: `${immediate.length} candidate${immediate.length > 1 ? 's' : ''}`,
      sub: immediate.map((d) => d.candidate.name.split(' ')[0]).join(', '),
    })
  }

  const salaries = data
    .map((d) =>
      salaryToEGP(
        d.candidate.salary_amount,
        d.candidate.salary_currency,
        d.candidate.salary_period,
      ),
    )
    .filter((v): v is number => v !== null)
  if (salaries.length > 0) {
    const min = Math.min(...salaries)
    const max = Math.max(...salaries)
    highlights.push({
      title: '💰 Salary range',
      value: `${Math.round(min / 1000)}K – ${Math.round(max / 1000)}K EGP/month`,
      sub: `${salaries.length} candidates with declared salary`,
    })
  }

  return highlights
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "analytics.ts"
```

Expected: no errors.

---

### Task 2: `DonutChart` component

**Files:**

- Create: `src/components/analysis/DonutChart.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/analysis/DonutChart.tsx
import type { DonutSlice } from '@/lib/analytics'

interface DonutChartProps {
  slices: DonutSlice[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({ slices, size = 120, strokeWidth = 14 }: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const total = slices.reduce((s, x) => s + x.value, 0) || 1

  let offset = 0
  const arcs = slices.map((slice) => {
    const pct = slice.value / total
    const dash = pct * circumference
    const arc = { ...slice, dash, gap: circumference - dash, offset }
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
        />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.filter((s) => s.value > 0).map((slice) => (
          <div key={slice.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: slice.color }}
            />
            <span className="text-[12px] text-text2">
              {slice.label}
              <span className="ml-1 font-semibold text-text">
                ({Math.round((slice.value / total) * 100)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "DonutChart"
```

Expected: no errors.

---

### Task 3: `DomainHeatmap` component

**Files:**

- Create: `src/components/analysis/DomainHeatmap.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/analysis/DomainHeatmap.tsx
import type { HeatmapData } from '@/lib/analytics'

interface DomainHeatmapProps {
  data: HeatmapData
}

export function DomainHeatmap({ data }: DomainHeatmapProps) {
  if (data.domains.length === 0) {
    return <p className="text-[12px] text-text3">No domain data available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[11px] border-collapse">
        <thead>
          <tr>
            <th className="text-left font-medium text-text3 pr-3 pb-1 whitespace-nowrap w-28">
              Candidate
            </th>
            {data.domains.map((dom) => (
              <th
                key={dom}
                className="font-medium text-text3 pb-1 px-1 whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxWidth: 20 }}
              >
                {dom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.candidateNames.map((name, ri) => (
            <tr key={name} className="group">
              <td className="pr-3 py-0.5 text-text2 font-medium whitespace-nowrap group-hover:text-text transition-colors">
                {name}
              </td>
              {data.grid[ri].map((covered, ci) => (
                <td key={ci} className="px-0.5 py-0.5">
                  <div
                    className="w-4 h-4 rounded-[3px] transition-opacity"
                    style={{
                      background: covered ? 'var(--brand)' : 'var(--surface2)',
                      opacity: covered ? 1 : 0.4,
                    }}
                    title={covered ? `${name} · ${data.domains[ci]}` : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "DomainHeatmap"
```

Expected: no errors.

---

### Task 4: `ExpandableRankingCard` component

Replaces `RankingTable`. Each card shows rank, name, fit score, verdict. Clicking expands to show strengths, watch-for, and scores inline.

**Files:**

- Create: `src/components/analysis/ExpandableRankingCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/analysis/ExpandableRankingCard.tsx
import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { maxScore } from '@/lib/scoring'
import { VERDICT_MAP } from '@/lib/verdicts'
import type { RankingEntry } from '@/lib/analytics'

interface CardData extends RankingEntry {
  name: string
  fitScore: number | null
  strengths: string[]
  watchFor: string | null
}

interface ExpandableRankingCardProps {
  entries: CardData[]
}

export function ExpandableRankingCard({ entries }: ExpandableRankingCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const max = maxScore()

  const sorted = [...entries].sort((a, b) => b.combinedScore - a.combinedScore)

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry, i) => {
        const isOpen = expanded === entry.candidateId
        const verdictMeta = entry.verdict
          ? VERDICT_MAP[entry.verdict as keyof typeof VERDICT_MAP]
          : null

        return (
          <div
            key={entry.candidateId}
            className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]"
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : entry.candidateId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface2 transition-colors"
            >
              <span className="text-[13px] font-mono text-text3 w-6 flex-shrink-0">
                #{i + 1}
              </span>
              <span className="flex-1 font-semibold text-[14px] text-text">{entry.name}</span>
              {entry.fitScore != null && (
                <span className="text-[13px] font-mono font-bold text-[var(--green)]">
                  {entry.fitScore}%
                </span>
              )}
              {entry.combinedScore > 0 && (
                <span className="text-[12px] font-mono text-text2">
                  {entry.combinedScore}/{max}
                </span>
              )}
              {verdictMeta && (
                <span
                  className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: verdictMeta.color,
                    background: `color-mix(in srgb, ${verdictMeta.color} 12%, transparent)`,
                  }}
                >
                  {verdictMeta.short}
                </span>
              )}
              <ChevronDownIcon
                className={cn('size-4 text-text3 transition-transform flex-shrink-0', isOpen && 'rotate-180')}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-3">
                {entry.strengths.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text3 mb-1.5">
                      Strengths
                    </p>
                    <ul className="flex flex-col gap-1">
                      {entry.strengths.map((s) => (
                        <li key={s} className="text-[12.5px] text-[var(--green)] flex gap-1.5">
                          <span>✓</span><span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.watchFor && (
                  <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-line)] rounded-[var(--radius-xs)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--amber)] mb-1">
                      Watch For
                    </p>
                    <p className="text-[12.5px] text-text2">{entry.watchFor}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "ExpandableRanking"
```

Expected: no errors.

---

### Task 5: `ComparisonTable` component

**Files:**

- Create: `src/components/analysis/ComparisonTable.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/analysis/ComparisonTable.tsx
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ComparisonRow } from '@/lib/analytics'
import { DataTable } from '@/components/ui/data-table'
import { formatSalary } from '@/lib/salary'
import { VERDICT_MAP } from '@/lib/verdicts'

interface ComparisonTableProps {
  rows: ComparisonRow[]
  onNameClick?: (id: string) => void
}

export function ComparisonTable({ rows, onNameClick }: ComparisonTableProps) {
  const columns = useMemo<ColumnDef<ComparisonRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        size: 160,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onNameClick?.(row.original.id)}
            className="font-semibold text-left text-foreground hover:text-primary transition-colors"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        id: 'fit',
        header: 'Fit',
        size: 60,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--green)]">
            {row.original.fitScore != null ? `${row.original.fitScore}%` : '—'}
          </span>
        ),
      },
      {
        id: 'pm',
        header: 'PM Exp',
        size: 72,
        cell: ({ row }) => (
          <span className="font-mono text-[12px]">
            {row.original.pmExp != null ? `${row.original.pmExp}y` : '—'}
          </span>
        ),
      },
      {
        id: 'total',
        header: 'Total Exp',
        size: 80,
        cell: ({ row }) => (
          <span className="font-mono text-[12px]">
            {row.original.totalExp != null ? `${row.original.totalExp}y` : '—'}
          </span>
        ),
      },
      {
        id: 'ai',
        header: 'AI',
        size: 44,
        cell: ({ row }) => (
          <span>{row.original.aiExp ? '✓' : '—'}</span>
        ),
      },
      {
        id: 'fin',
        header: 'Fin',
        size: 44,
        cell: ({ row }) => (
          <span>{row.original.fintech ? '✓' : '—'}</span>
        ),
      },
      {
        id: 'b2b',
        header: 'B2B',
        size: 44,
        cell: ({ row }) => (
          <span>{row.original.b2b ? '✓' : '—'}</span>
        ),
      },
      {
        id: 'uni',
        header: 'University',
        size: 140,
        cell: ({ row }) => (
          <span className="text-[12px] text-muted-foreground">{row.original.university ?? '—'}</span>
        ),
      },
      {
        id: 'salary',
        header: 'Salary',
        size: 140,
        cell: ({ row }) => (
          <span className="text-[12px] font-mono">
            {formatSalary(row.original.salaryAmount, row.original.salaryCurrency, row.original.salaryPeriod)}
          </span>
        ),
      },
      {
        id: 'notice',
        header: 'Notice',
        size: 90,
        cell: ({ row }) => (
          <span className="text-[12px] text-muted-foreground">{row.original.notice ?? '—'}</span>
        ),
      },
      {
        id: 'verdict',
        header: 'Verdict',
        size: 100,
        cell: ({ row }) => {
          const v = row.original.verdict
          const meta = v ? VERDICT_MAP[v as keyof typeof VERDICT_MAP] : null
          return meta ? (
            <span className="text-[12px] font-semibold" style={{ color: meta.color }}>
              {meta.short}
            </span>
          ) : null
        },
      },
    ],
    [onNameClick],
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      sortable
      pageSize={rows.length || 1}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "ComparisonTable"
```

Expected: no errors.

---

### Task 6: `KeyHighlights` component

**Files:**

- Create: `src/components/analysis/KeyHighlights.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/analysis/KeyHighlights.tsx
import type { Highlight } from '@/lib/analytics'

interface KeyHighlightsProps {
  highlights: Highlight[]
}

export function KeyHighlights({ highlights }: KeyHighlightsProps) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {highlights.map((h) => (
        <div
          key={h.title}
          className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow-sm)]"
        >
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text3 mb-1">
            {h.title}
          </p>
          <p className="text-[15px] font-semibold text-text leading-tight">{h.value}</p>
          {h.sub && <p className="text-[12px] text-text2 mt-1">{h.sub}</p>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "KeyHighlights"
```

Expected: no errors.

---

### Task 7: Rewrite `AnalysisPage.tsx`

Wire all new components and compute functions into a complete page. The existing sections (KPIs, total exp bar, domain freq bar, scatter, interviewer accountability) are kept. Seven new sections are added.

**Files:**

- Modify: `src/pages/AnalysisPage.tsx`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/pages/AnalysisPage.tsx
import { useState } from 'react'
import { useCandidates } from '@/hooks/useCandidates'
import { useCandidateState } from '@/hooks/useCandidateState'
import {
  computeKPIs,
  computeDomainFrequency,
  computeRanking,
  computePmExpBars,
  computeSalaryBars,
  computeEducationData,
  computeDomainCoverage,
  computeHeatmap,
  computeComparisonRows,
  computeKeyHighlights,
} from '@/lib/analytics'
import { salaryToEGP } from '@/lib/salary'
import { KPICards } from '@/components/analysis/KPICards'
import { HorizontalBar } from '@/components/analysis/HorizontalBar'
import { ScatterPlot } from '@/components/analysis/ScatterPlot'
import { DonutChart } from '@/components/analysis/DonutChart'
import { DomainHeatmap } from '@/components/analysis/DomainHeatmap'
import { ExpandableRankingCard } from '@/components/analysis/ExpandableRankingCard'
import { ComparisonTable } from '@/components/analysis/ComparisonTable'
import { KeyHighlights } from '@/components/analysis/KeyHighlights'
import { InterviewerAccountability } from '@/components/analysis/InterviewerAccountability'
import { Spinner } from '@/components/ui/spinner'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text3">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text2 mb-4">
        {title}
      </p>
      {children}
    </div>
  )
}

export function AnalysisPage() {
  const { data, loading } = useCandidates()
  const { stateMap } = useCandidateState()
  const [, setOpenProfileId] = useState<string | null>(null)

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const analysisRows = data
    .map((d) => d.analysis)
    .filter((a): a is NonNullable<typeof a> => a !== null)
  const stateRows = Object.values(stateMap)
  const kpis = computeKPIs(analysisRows, stateRows)
  const domainFreq = computeDomainFrequency(analysisRows)
  const rawRanking = computeRanking(analysisRows, stateMap, {})

  // ── existing charts ────────────────────────────────────────────────────────
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

  // ── new charts ─────────────────────────────────────────────────────────────
  const pmExpData = computePmExpBars(data)
  const salaryBars = computeSalaryBars(data, salaryToEGP)
  const { degreeSlices, gradYearBars } = computeEducationData(data)
  const { ai: aiSlices, fintech: fintechSlices, b2bB2c: b2bSlices } = computeDomainCoverage(analysisRows)
  const heatmapData = computeHeatmap(data)
  const comparisonRows = computeComparisonRows(data, stateMap)
  const highlights = computeKeyHighlights(data, salaryToEGP)

  const rankingCards = rawRanking.map((e) => {
    const d = data.find((x) => x.candidate.id === e.candidateId)
    return {
      ...e,
      name: d?.candidate.name ?? e.candidateId,
      fitScore: d?.profile?.fit_score ?? null,
      strengths: d?.profile?.strengths ?? [],
      watchFor: d?.profile?.watch_for ?? null,
    }
  })

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">📊 Analysis</h1>
      <p className="text-text2 text-[13.5px] mb-8">
        Candidate pool analysis for May 2026 Senior PM hiring round.
      </p>

      {/* KPIs */}
      <div className="mb-8">
        <KPICards kpis={kpis} />
      </div>

      {/* Key Highlights */}
      <div className="mb-8">
        <SectionTitle>Key Highlights</SectionTitle>
        <KeyHighlights highlights={highlights} />
      </div>

      {/* Experience Overview */}
      <div className="mb-8">
        <SectionTitle>Experience Overview</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <ChartCard title="Total Years Experience">
            <HorizontalBar data={expData} unit="y" />
          </ChartCard>
          <ChartCard title="PM Experience">
            <HorizontalBar data={pmExpData} unit="y" />
          </ChartCard>
        </div>
        <ChartCard title="PM Exp vs Fit Score — scatter">
          <ScatterPlot points={scatterPoints} xLabel="PM Experience (yrs)" yLabel="Fit Score (%)" />
        </ChartCard>
      </div>

      {/* Salary Comparison */}
      {salaryBars.length > 0 && (
        <div className="mb-8">
          <SectionTitle>Salary Comparison</SectionTitle>
          <ChartCard title="All candidates — sorted highest to lowest (red = premium, blue = mid, green = competitive)">
            <HorizontalBar data={salaryBars} />
          </ChartCard>
        </div>
      )}

      {/* Education */}
      <div className="mb-8">
        <SectionTitle>Education</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Degree Type Distribution">
            <DonutChart slices={degreeSlices} />
          </ChartCard>
          <ChartCard title="Graduation Year — blue 2020+, amber 2016–2019, grey before 2016">
            <HorizontalBar data={gradYearBars} />
          </ChartCard>
        </div>
      </div>

      {/* Domain & Skills Coverage */}
      <div className="mb-8">
        <SectionTitle>Domain & Skills Coverage</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ChartCard title="AI / Tech Experience">
            <DonutChart slices={aiSlices} />
          </ChartCard>
          <ChartCard title="Fintech Experience">
            <DonutChart slices={fintechSlices} />
          </ChartCard>
          <ChartCard title="B2B vs B2C Focus">
            <DonutChart slices={b2bSlices} />
          </ChartCard>
        </div>
        <ChartCard title="Domain Heatmap — coloured cells show coverage, hover for name">
          <DomainHeatmap data={heatmapData} />
        </ChartCard>
        <div className="mt-4">
          <ChartCard title="Domain Frequency">
            <HorizontalBar data={domainData} />
          </ChartCard>
        </div>
      </div>

      {/* Candidate Ranking */}
      <div className="mb-8">
        <SectionTitle>🏆 Candidate Ranking — click any card to expand</SectionTitle>
        <ExpandableRankingCard entries={rankingCards} />
      </div>

      {/* Full Comparison Table */}
      <div className="mb-8">
        <SectionTitle>Full Comparison Table</SectionTitle>
        <ComparisonTable rows={comparisonRows} onNameClick={setOpenProfileId} />
      </div>

      {/* Interviewer Accountability */}
      <div className="mb-8">
        <SectionTitle>Interviewer Accountability</SectionTitle>
        <InterviewerAccountability />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 3: Open the app and verify**

Navigate to `http://localhost:5173` → Analysis tab. Confirm:

- Key Highlights cards appear at the top
- PM Experience bar chart alongside Total Experience
- Salary comparison bars (if candidates have salary data)
- Education section with degree donut + grad year bars
- Three domain donuts + heatmap
- Expandable ranking cards (click one to verify expansion shows strengths + watch-for)
- Full comparison table with all candidates
