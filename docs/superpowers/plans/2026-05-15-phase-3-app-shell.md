# Phase 3: App Shell & Routing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the persistent app shell — React Router routes, sticky header (logo, progress ring, pipeline health snapshot, action buttons), tab navigation, dismissible alert banners, and a 3-way Light/Dark/System theme toggle — with all tab pages stubbed as empty placeholders.

**Architecture:** React Router v6 wraps all routes in an `<AuthGuard>`. A single `<Layout>` component renders the header and tab nav persistently; page content renders in an `<Outlet>`. Theme preference is stored in `localStorage` and applied via `data-theme` on `<html>` before first render to avoid flash.

**Tech Stack:** `react-router-dom` v6, `@supabase/supabase-js` (for auth state), Tailwind, shadcn/ui

**Prerequisites:** Phase 2 complete. Supabase client and auth components exist.

---

### Task 1: Install React Router + Wire Up Routes

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/CardsPage.tsx` (stub)
- Create: `src/pages/SchedulePage.tsx` (stub)
- Create: `src/pages/ComparePage.tsx` (stub)
- Create: `src/pages/QuestionsPage.tsx` (stub)
- Create: `src/pages/SalaryPage.tsx` (stub)
- Create: `src/pages/BriefingPage.tsx` (stub)
- Create: `src/pages/AnalysisPage.tsx` (stub)
- Create: `src/pages/ChatPage.tsx` (stub)

- [ ] **Step 1: Install React Router**
```bash
npm install react-router-dom
```

- [ ] **Step 2: Create stub page components**

Create each of the following with the same pattern. Example for `src/pages/CardsPage.tsx`:
```tsx
export function CardsPage() {
  return <div className="p-6 text-text font-sans">Cards — coming in Phase 4</div>
}
```

Repeat for `SchedulePage`, `ComparePage`, `QuestionsPage`, `SalaryPage`, `BriefingPage`, `AnalysisPage`, `ChatPage` — each returning its own label string.

- [ ] **Step 3: Replace App.tsx with full router setup**

Replace `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AuthCallback } from '@/components/auth/AuthCallback'
import { LoginPage } from '@/components/auth/LoginPage'
import { Layout } from '@/components/layout/Layout'
import { CardsPage } from '@/pages/CardsPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { ComparePage } from '@/pages/ComparePage'
import { QuestionsPage } from '@/pages/QuestionsPage'
import { SalaryPage } from '@/pages/SalaryPage'
import { BriefingPage } from '@/pages/BriefingPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { ChatPage } from '@/pages/ChatPage'
import { useSearchParams } from 'react-router-dom'

function LoginPageWithError() {
  const [params] = useSearchParams()
  const error = params.get('error') === 'unauthorized'
    ? 'Only @intellaworld.com accounts can access this dashboard.'
    : undefined
  return <LoginPage error={error} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPageWithError />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/cards" replace />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="salary" element={<SalaryPage />} />
          <Route path="briefing" element={<BriefingPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Verify routing works**
```bash
npm run dev
```
Navigate to `http://localhost:5173`. Expected: redirected to `/login` (AuthGuard fires since no session). Kill the server.

- [ ] **Step 5: Write route tests**

Create `src/test/routing.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Minimal smoke test: correct page renders for each path
const pages = [
  ['cards', 'Cards'],
  ['schedule', 'Schedule'],
  ['compare', 'Compare'],
  ['questions', 'Questions'],
  ['salary', 'Salary'],
  ['briefing', 'Briefing'],
  ['analysis', 'Analysis'],
  ['chat', 'Chat'],
]

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    loading: false,
    session: { user: { email: 'test@intellaworld.com' } },
    isIntellaUser: true,
  }),
}))

describe('routing', () => {
  it.each(pages)('renders %s page at /%s', (_path, label) => {
    render(
      <MemoryRouter initialEntries={[`/${_path}`]}>
        <Routes>
          <Route path={`/${_path}`} element={<div>{label} — coming in Phase 4</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText(`${label} — coming in Phase 4`)).toBeTruthy()
  })
})
```

```bash
npm run test:run src/test/routing.test.tsx
```
Expected: 8 tests pass.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(shell): add react router with all page stubs"
```

---

### Task 2: Theme Hook (Light / Dark / System)

**Files:**
- Create: `src/hooks/useTheme.ts`
- Create: `src/components/layout/ThemeToggle.tsx`

- [ ] **Step 1: Write failing tests first**

Create `src/hooks/__tests__/useTheme.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock localStorage
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
})

// Mock matchMedia
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query.includes('dark'),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

describe('useTheme', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]) })

  it('defaults to system when no saved preference', async () => {
    const { useTheme } = await import('../useTheme')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('restores saved preference from localStorage', async () => {
    store['intella_theme'] = 'dark'
    const { useTheme } = await import('../useTheme')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('setTheme persists to localStorage and updates html attribute', async () => {
    const { useTheme } = await import('../useTheme')
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))
    expect(store['intella_theme']).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**
```bash
npm run test:run src/hooks/__tests__/useTheme.test.ts
```
Expected: FAIL — `useTheme` module not found.

- [ ] **Step 3: Implement useTheme**

Create `src/hooks/useTheme.ts`:
```ts
import { useEffect, useState } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'intella_theme'

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', preference)
  }
}

// Apply theme before first render to avoid flash (called outside React)
const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
applyTheme(saved ?? 'system')

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePreference) ?? 'system',
  )

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
    applyTheme(next)
  }

  return { theme, setTheme }
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/hooks/__tests__/useTheme.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 5: Build the ThemeToggle component**

Create `src/components/layout/ThemeToggle.tsx`:
```tsx
import { useTheme } from '@/hooks/useTheme'

const options = [
  { value: 'light' as const, label: 'Light', icon: '☀' },
  { value: 'dark' as const, label: 'Dark', icon: '☾' },
  { value: 'system' as const, label: 'System', icon: '⊙' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-0.5 bg-surface2 border border-border rounded-[var(--radius-sm)] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={[
            'px-2.5 py-1 rounded-[5px] text-xs font-medium font-sans transition-all duration-150 cursor-pointer',
            theme === opt.value
              ? 'bg-surface text-text shadow-[var(--shadow-sm)]'
              : 'text-text3 hover:text-text2',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(shell): add three-way light/dark/system theme toggle"
```

---

### Task 3: Layout Shell + Header

**Files:**
- Create: `src/components/layout/Layout.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/ProgressRing.tsx`
- Create: `src/components/layout/PipelineHealthSnapshot.tsx`
- Create: `src/hooks/usePipelineStats.ts`

- [ ] **Step 1: Write failing test for pipeline stats**

Create `src/hooks/__tests__/usePipelineStats.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computePipelineStats } from '../usePipelineStats'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']

const makeState = (overrides: Partial<State>): State => ({
  candidate_id: 'x',
  confirmed: false,
  shortlisted: null,
  interview_status: 'pending',
  verdict: null,
  peter_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 },
  ossama_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 },
  peter_comment: '',
  ossama_comment: '',
  checklist: {},
  photo_url: null,
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('computePipelineStats', () => {
  it('counts completed interviews', () => {
    const states = [
      makeState({ interview_status: 'completed' }),
      makeState({ interview_status: 'completed' }),
      makeState({ interview_status: 'pending' }),
    ]
    const stats = computePipelineStats(states, new Date('2026-05-17'))
    expect(stats.completedCount).toBe(2)
    expect(stats.totalCount).toBe(3)
  })

  it('counts candidates with a verdict', () => {
    const states = [
      makeState({ verdict: 'yes' }),
      makeState({ verdict: null }),
      makeState({ verdict: 'no' }),
    ]
    const stats = computePipelineStats(states, new Date('2026-05-17'))
    expect(stats.withVerdictCount).toBe(2)
  })

  it('counts filled scorecards (at least one non-zero score)', () => {
    const states = [
      makeState({ peter_scores: { Communication: 3, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 } }),
      makeState({ peter_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 } }),
    ]
    const stats = computePipelineStats(states, new Date('2026-05-17'))
    expect(stats.scorecardFilledCount).toBe(1)
  })

  it('calculates days since round opened from May 17 2026', () => {
    const states = [makeState({})]
    const stats = computePipelineStats(states, new Date('2026-05-19'))
    expect(stats.daysSinceStart).toBe(2)
  })
})
```

- [ ] **Step 2: Run to verify failure**
```bash
npm run test:run src/hooks/__tests__/usePipelineStats.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement usePipelineStats**

Create `src/hooks/usePipelineStats.ts`:
```ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type State = Database['public']['Tables']['interview_state']['Row']
type Scores = { Communication: number; Technical: number; 'Culture Fit': number; Leadership: number; Overall: number }

const ROUND_START = new Date('2026-05-17')

export interface PipelineStats {
  totalCount: number
  completedCount: number
  withVerdictCount: number
  scorecardFilledCount: number
  daysSinceStart: number
}

export function computePipelineStats(states: State[], now: Date): PipelineStats {
  const totalCount = states.length
  const completedCount = states.filter((s) => s.interview_status === 'completed').length
  const withVerdictCount = states.filter((s) => s.verdict !== null).length
  const scorecardFilledCount = states.filter((s) => {
    const ps = s.peter_scores as Scores
    const os = s.ossama_scores as Scores
    return Object.values(ps).some((v) => v > 0) || Object.values(os).some((v) => v > 0)
  }).length
  const daysSinceStart = Math.floor(
    (now.getTime() - ROUND_START.getTime()) / (1000 * 60 * 60 * 24),
  )
  return { totalCount, completedCount, withVerdictCount, scorecardFilledCount, daysSinceStart }
}

export function usePipelineStats() {
  const [stats, setStats] = useState<PipelineStats | null>(null)

  useEffect(() => {
    supabase
      .from('interview_state')
      .select('*')
      .then(({ data }) => {
        if (data) setStats(computePipelineStats(data, new Date()))
      })
  }, [])

  return stats
}
```

- [ ] **Step 4: Run tests to verify they pass**
```bash
npm run test:run src/hooks/__tests__/usePipelineStats.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 5: Build ProgressRing**

Create `src/components/layout/ProgressRing.tsx`:
```tsx
interface ProgressRingProps {
  done: number
  total: number
}

export function ProgressRing({ done, total }: ProgressRingProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="flex items-center gap-2" title={`${done}/${total} interviews completed`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke="var(--green)" strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{
            strokeDasharray: circ,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s',
          }}
        />
        <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700"
          fill="var(--text)" fontFamily="DM Mono, monospace">
          {pct}%
        </text>
      </svg>
      <div className="text-[10px] text-text2 leading-tight">
        <div className="font-semibold text-text">{done}/{total}</div>
        <div>done</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Build PipelineHealthSnapshot**

Create `src/components/layout/PipelineHealthSnapshot.tsx`:
```tsx
import { usePipelineStats } from '@/hooks/usePipelineStats'

export function PipelineHealthSnapshot() {
  const stats = usePipelineStats()
  if (!stats) return null

  const scorecardPct = stats.totalCount > 0
    ? Math.round((stats.scorecardFilledCount / stats.totalCount) * 100)
    : 0
  const verdictPct = stats.totalCount > 0
    ? Math.round((stats.withVerdictCount / stats.totalCount) * 100)
    : 0

  return (
    <div className="hidden md:flex items-center gap-4 text-[11px] font-sans text-text3">
      <span>
        <span className="font-semibold text-text">{scorecardPct}%</span> scored
      </span>
      <span>
        <span className="font-semibold text-text">{verdictPct}%</span> verdicted
      </span>
      <span>
        Day <span className="font-semibold text-text">{stats.daysSinceStart + 1}</span>
      </span>
    </div>
  )
}
```

- [ ] **Step 7: Build the Header**

Create `src/components/layout/Header.tsx`:
```tsx
import { ProgressRing } from './ProgressRing'
import { PipelineHealthSnapshot } from './PipelineHealthSnapshot'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStats } from '@/hooks/usePipelineStats'

interface HeaderProps {
  onShortlist?: () => void
  onExportReport?: () => void
  onExportExcel?: () => void
  onPrint?: () => void
}

export function Header({ onShortlist, onExportReport, onExportExcel, onPrint }: HeaderProps) {
  const { signOut } = useAuth()
  const stats = usePipelineStats()

  return (
    <header
      className="sticky top-0 z-[100] flex items-center justify-between gap-4 flex-wrap px-6 py-3.5 border-b border-border"
      style={{
        background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
      {/* Left: logo + progress */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0"
            style={{
              background: 'radial-gradient(120% 100% at 0% 0%, #4c44c4, #2a2479 70%)',
              boxShadow: '0 1px 0 rgba(255,255,255,.35) inset, 0 4px 12px -4px rgba(42,36,121,.5)',
            }}
          />
          <span className="text-[17px] font-semibold tracking-tight text-text font-sans">
            Intella{' '}
            <span className="text-text2 font-normal text-[14px]">/ Interview Dashboard</span>
          </span>
        </div>

        {/* Progress ring + health */}
        <div className="flex items-center gap-3 ml-2">
          <ProgressRing done={stats?.completedCount ?? 0} total={stats?.totalCount ?? 0} />
          <PipelineHealthSnapshot />
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onShortlist}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 border"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)', borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)' }}
        >
          ★ Shortlist
        </button>
        <button onClick={onExportReport} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 bg-text text-bg border border-text hover:bg-text2">
          Report PDF
        </button>
        <button onClick={onExportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 bg-surface border border-border text-text2 hover:bg-surface2 hover:text-text">
          Export Excel
        </button>
        <button onClick={onPrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 bg-surface border border-border text-text2 hover:bg-surface2 hover:text-text">
          Print
        </button>
        <ThemeToggle />
        <button onClick={signOut} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium font-sans cursor-pointer transition-all duration-150 text-text3 hover:text-text">
          Sign out
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "feat(shell): add header with progress ring and pipeline health"
```

---

### Task 4: Tab Navigation + Alert Banners + Layout

**Files:**
- Create: `src/components/layout/TabNav.tsx`
- Create: `src/components/layout/AlertBanners.tsx`
- Create: `src/components/layout/Layout.tsx`

- [ ] **Step 1: Build TabNav**

Create `src/components/layout/TabNav.tsx`:
```tsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/cards', label: 'Cards' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/compare', label: 'Compare' },
  { to: '/questions', label: 'Questions' },
  { to: '/salary', label: 'Salary Chart' },
  { to: '/briefing', label: 'Day Briefing' },
  { to: '/analysis', label: '📊 Analysis' },
  { to: '/chat', label: 'AI Assistant' },
]

export function TabNav() {
  return (
    <nav
      className="bg-bg border-b border-border px-6 flex overflow-x-auto gap-0.5"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [
              'font-sans text-[13px] font-medium px-3.5 py-3 border-b-[1.5px] -mb-px transition-all duration-150 whitespace-nowrap cursor-pointer',
              isActive
                ? 'text-text border-b-text font-semibold'
                : 'text-text2 border-b-transparent hover:text-text',
            ].join(' ')
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Build AlertBanners**

Create `src/components/layout/AlertBanners.tsx`:
```tsx
import { useState } from 'react'

interface Alert {
  id: string
  message: string
  variant: 'amber' | 'blue'
}

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'george',
    message: '⚠ George Fekry has no interview slot assigned yet.',
    variant: 'amber',
  },
  {
    id: 'aliaa',
    message: '🕒 Aliaa Elfeky confirmation still pending (Tue 19 May 16:00)',
    variant: 'blue',
  },
]

export function AlertBanners() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = INITIAL_ALERTS.filter((a) => !dismissed.has(a.id))

  if (!visible.length) return null

  return (
    <div className="px-6 pt-3 flex flex-col gap-1.5">
      {visible.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between px-3.5 py-2 rounded-[var(--radius-sm)] border text-[12.5px] font-sans"
          style={{
            background: alert.variant === 'amber' ? 'var(--amber-bg)' : 'var(--blue-bg)',
            borderColor: alert.variant === 'amber' ? 'var(--amber-line)' : 'var(--blue-line)',
            color: alert.variant === 'amber' ? 'var(--amber)' : 'var(--blue)',
          }}
        >
          <span>{alert.message}</span>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
            className="ml-3 opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none text-inherit text-sm"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Build the Layout**

Create `src/components/layout/Layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { TabNav } from './TabNav'
import { AlertBanners } from './AlertBanners'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <TabNav />
      <AlertBanners />
      <main className="max-w-[1480px] mx-auto px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Verify the full shell renders**
```bash
npm run dev
```
Sign in with a `@intellaworld.com` Google account. Expected:
- Sticky header with logo, progress ring, health snapshot, buttons, theme toggle
- Tab nav with 8 tabs, active tab highlighted
- Alert banners for George and Aliaa
- Page content area showing stub text

Switch theme between Light/Dark/System — verify background and text colors change correctly.

Kill the server.

- [ ] **Step 5: Write AlertBanners test**

Create `src/components/layout/__tests__/AlertBanners.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlertBanners } from '../AlertBanners'

describe('AlertBanners', () => {
  it('renders both default alerts', () => {
    render(<AlertBanners />)
    expect(screen.getByText(/George Fekry/)).toBeTruthy()
    expect(screen.getByText(/Aliaa Elfeky/)).toBeTruthy()
  })

  it('dismisses an alert on button click', () => {
    render(<AlertBanners />)
    const dismissButtons = screen.getAllByLabelText('Dismiss')
    fireEvent.click(dismissButtons[0])
    expect(screen.queryByText(/George Fekry/)).toBeNull()
    expect(screen.getByText(/Aliaa Elfeky/)).toBeTruthy()
  })
})
```

```bash
npm run test:run src/components/layout/__tests__/AlertBanners.test.tsx
```
Expected: 2 tests pass.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(shell): add tab nav, alert banners, and layout"
```

---

**Phase 3 complete.** The app shell is fully functional with auth, routing, header, tabs, and theme switching. Proceed to Phase 4: Cards Tab.
