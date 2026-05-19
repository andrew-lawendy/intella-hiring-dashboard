# Salary Structured Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text `salary` column with three typed columns — `salary_amount integer`, `salary_currency text`, `salary_period text` — so salary data is structured, comparable, and unambiguous.

**Architecture:** A new `src/lib/salary.ts` utility (rewritten from its current string-parsing form) provides `formatSalary` and `salaryToEGP` using the structured columns. All consumers switch from `candidate.salary` (string) to these helpers. The seed data is re-seeded with clean integer values. No `parseSalaryToEGP` string parser is needed anymore.

**Tech Stack:** PostgreSQL, Supabase JS v2, React 18, TypeScript, existing project patterns.

---

## File Map

| File                                               | Action  | Responsibility                                                           |
| -------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `supabase/migrations/012_salary_structured.sql`    | Create  | Drop `salary`, add `salary_amount`/`salary_currency`/`salary_period`     |
| `src/lib/database.types.ts`                        | Modify  | Replace `salary: string \| null` with three typed columns                |
| `src/lib/salary.ts`                                | Rewrite | `formatSalary`, `salaryToEGP`, `sortBySalary` using structured data      |
| `src/hooks/useCreateCandidate.ts`                  | Modify  | Replace `salary: string` with `salaryAmount/salaryCurrency/salaryPeriod` |
| `src/components/candidates/AddCandidateDrawer.tsx` | Modify  | Update default values                                                    |
| `src/components/candidates/steps/StepIdentity.tsx` | Modify  | Replace free-text salary with amount + currency + period inputs          |
| `src/components/profile/ProfileLogistics.tsx`      | Modify  | Update `InlineSalaryField` to use structured columns                     |
| `src/components/cards/CardBody.tsx`                | Modify  | Display via `formatSalary`                                               |
| `src/components/briefing/BriefCard.tsx`            | Modify  | Display via `formatSalary`                                               |
| `src/pages/SchedulePage.tsx`                       | Modify  | Display via `formatSalary`                                               |
| `src/pages/SalaryPage.tsx`                         | Modify  | Use `salaryToEGP` and `sortBySalary` with structured data                |
| `src/lib/compare.ts`                               | Modify  | Display via `formatSalary`                                               |
| `src/lib/exports.ts`                               | Modify  | Display via `formatSalary`                                               |
| `src/lib/systemPrompt.ts`                          | Modify  | Display via `formatSalary`                                               |
| `supabase/seed/data/candidates.ts`                 | Modify  | Replace `salary` string with three structured fields                     |

---

### Task 1: SQL migration

**Files:**

- Create: `supabase/migrations/012_salary_structured.sql`

- [ ] **Step 1: Create the file**

```sql
-- supabase/migrations/012_salary_structured.sql
ALTER TABLE candidates
  ADD COLUMN salary_amount  integer,
  ADD COLUMN salary_currency text,
  ADD COLUMN salary_period  text;

ALTER TABLE candidates
  DROP COLUMN salary;
```

---

### Task 2: Update `database.types.ts`

**Files:**

- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Replace the salary column in the candidates Row type**

Find `salary: string | null` and replace with:

```typescript
salary_amount: number | null
salary_currency: string | null
salary_period: string | null
```

The full candidates Row becomes:

```typescript
candidates: {
  Row: {
    id: string
    name: string
    email: string
    interview_at: string | null
    type: 'In-person' | 'Remote' | null
    salary_amount: number | null
    salary_currency: string | null
    salary_period: string | null
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

Expected: errors in files that still reference `candidate.salary` — fixed in later tasks.

---

### Task 3: Rewrite `src/lib/salary.ts`

Replaces the old string-parsing approach with simple arithmetic on structured data.

**Files:**

- Modify: `src/lib/salary.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
// src/lib/salary.ts
export const DEFAULT_USD_TO_EGP = 50

/** "65,000 EGP/month" — returns "TBD" when any field is missing */
export function formatSalary(
  amount: number | null | undefined,
  currency: string | null | undefined,
  period: string | null | undefined,
): string {
  if (amount == null || !currency || !period) return 'TBD'
  return `${amount.toLocaleString()} ${currency}/${period}`
}

/** Monthly EGP equivalent for chart comparison. Returns null when any field is missing. */
export function salaryToEGP(
  amount: number | null | undefined,
  currency: string | null | undefined,
  period: string | null | undefined,
  usdToEgp: number = DEFAULT_USD_TO_EGP,
): number | null {
  if (amount == null || !currency || !period) return null
  const monthly = period === 'year' ? amount / 12 : amount
  return currency === 'USD' ? monthly * usdToEgp : monthly
}

export function sortBySalary<T>(
  items: T[],
  getSalary: (item: T) => {
    salary_amount: number | null
    salary_currency: string | null
    salary_period: string | null
  },
): T[] {
  return [...items].sort((a, b) => {
    const s = getSalary(a)
    const t = getSalary(b)
    const va = salaryToEGP(s.salary_amount, s.salary_currency, s.salary_period)
    const vb = salaryToEGP(t.salary_amount, t.salary_currency, t.salary_period)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    return vb - va
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "salary.ts"
```

Expected: no errors in this file.

---

### Task 4: Update `useCreateCandidate.ts`

**Files:**

- Modify: `src/hooks/useCreateCandidate.ts`

- [ ] **Step 1: Update `CreateCandidateInput` — replace `salary` with three fields**

Replace:

```typescript
salary: string
```

With:

```typescript
salaryAmount: string
salaryCurrency: 'EGP' | 'USD'
salaryPeriod: 'month' | 'year'
```

- [ ] **Step 2: Update the mutation — replace `salary` insert field**

Replace:

```typescript
salary: data.salary.trim() || null,
```

With:

```typescript
salary_amount: data.salaryAmount ? parseInt(data.salaryAmount.replace(/\D/g, '')) || null : null,
salary_currency: data.salaryAmount && data.salaryAmount.replace(/\D/g, '') ? data.salaryCurrency : null,
salary_period: data.salaryAmount && data.salaryAmount.replace(/\D/g, '') ? data.salaryPeriod : null,
```

- [ ] **Step 3: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "useCreateCandidate"
```

Expected: no errors in this file.

---

### Task 5: Update `AddCandidateDrawer.tsx` and `StepIdentity.tsx`

**Files:**

- Modify: `src/components/candidates/AddCandidateDrawer.tsx`
- Modify: `src/components/candidates/steps/StepIdentity.tsx`

- [ ] **Step 1: Update `AddCandidateDrawer.tsx` default values**

Replace:

```typescript
salary: '',
```

With:

```typescript
salaryAmount: '',
salaryCurrency: 'EGP',
salaryPeriod: 'month',
```

- [ ] **Step 2: Update `StepIdentity.tsx` salary section**

Add import at top:

```typescript
import { cn } from '@/lib/utils'
```

(Only if not already imported — check first.)

Replace the entire expected salary `FieldWrapper` block with:

```tsx
<div className="grid grid-cols-2 gap-4">
  <FieldWrapper label="Expected salary" optional htmlFor="field-salary-amount" hint="Net amount">
    <Input
      id="field-salary-amount"
      type="text"
      inputMode="numeric"
      placeholder="65,000"
      value={values.salaryAmount}
      onChange={(e) => setField('salaryAmount', e.target.value.replace(/[^0-9,]/g, ''))}
    />
  </FieldWrapper>

  <FieldWrapper label="Currency / period" optional>
    <div className="flex gap-2">
      <select
        value={values.salaryCurrency}
        onChange={(e) => setField('salaryCurrency', e.target.value as 'EGP' | 'USD')}
        aria-label="Salary currency"
        className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
      >
        <option value="EGP">EGP</option>
        <option value="USD">USD</option>
      </select>
      <select
        value={values.salaryPeriod}
        onChange={(e) => setField('salaryPeriod', e.target.value as 'month' | 'year')}
        aria-label="Salary period"
        className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
      >
        <option value="month">/ month</option>
        <option value="year">/ year</option>
      </select>
    </div>
  </FieldWrapper>
</div>
```

Note: the old salary field was inside a `grid grid-cols-2` alongside notice period. Keep the grid but replace the salary `FieldWrapper` only — do not change notice period.

- [ ] **Step 3: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep -E "AddCandidateDrawer|StepIdentity"
```

Expected: no errors.

---

### Task 6: Update `ProfileLogistics.tsx`

Replace the `InlineSalaryField` props to use the three structured columns and update `parseSalaryValue` accordingly.

**Files:**

- Modify: `src/components/profile/ProfileLogistics.tsx`

- [ ] **Step 1: Add `formatSalary` import**

Add to the existing imports from `@/lib/salary`:

```typescript
import { formatSalary } from '@/lib/salary'
```

- [ ] **Step 2: Replace `InlineSalaryFieldProps` and `parseSalaryValue`**

Replace the entire `InlineSalaryField` section (from the `// ─── InlineSalaryField` comment through the closing `}` of the component) with:

```typescript
// ─── InlineSalaryField ───────────────────────────────────────────────────────

const SALARY_CURRENCIES = ['EGP', 'USD'] as const
const SALARY_PERIODS = ['month', 'year'] as const
type SalaryCurrency = (typeof SALARY_CURRENCIES)[number]
type SalaryPeriod = (typeof SALARY_PERIODS)[number]

interface InlineSalaryFieldProps {
  amount: number | null | undefined
  currency: string | null | undefined
  period: string | null | undefined
  onSave: (amount: number, currency: string, period: string) => Promise<void>
}

function InlineSalaryField({ amount, currency, period, onSave }: InlineSalaryFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draftAmount, setDraftAmount] = useState('')
  const [draftCurrency, setDraftCurrency] = useState<SalaryCurrency>('EGP')
  const [draftPeriod, setDraftPeriod] = useState<SalaryPeriod>('month')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraftAmount(amount != null ? amount.toLocaleString() : '')
    setDraftCurrency((currency as SalaryCurrency) ?? 'EGP')
    setDraftPeriod((period as SalaryPeriod) ?? 'month')
    setEditing(true)
    setTimeout(() => amountRef.current?.focus(), 0)
  }

  async function save() {
    const digits = draftAmount.replace(/\D/g, '')
    if (!digits) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(parseInt(digits), draftCurrency, draftPeriod)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function cancel() { setEditing(false) }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        Salary
      </span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={amountRef}
            type="text"
            inputMode="numeric"
            aria-label="Salary amount"
            value={draftAmount}
            placeholder="65,000"
            onChange={(e) => setDraftAmount(e.target.value.replace(/[^0-9,]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') cancel()
            }}
            className="w-24 h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <select
            value={draftCurrency}
            onChange={(e) => setDraftCurrency(e.target.value as SalaryCurrency)}
            aria-label="Salary currency"
            className="h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {SALARY_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={draftPeriod}
            onChange={(e) => setDraftPeriod(e.target.value as SalaryPeriod)}
            aria-label="Salary period"
            className="h-7 rounded-md border border-ring bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {SALARY_PERIODS.map((p) => <option key={p} value={p}>/{p}</option>)}
          </select>
          <button type="button" onClick={save} disabled={saving} aria-label="Save"
            className="p-1 text-[var(--green)] hover:opacity-70 disabled:opacity-40 transition-opacity">
            <CheckIcon className="size-3.5" />
          </button>
          <button type="button" onClick={cancel} aria-label="Cancel"
            className="p-1 text-muted-foreground hover:text-destructive transition-colors">
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={startEdit}
          className="group flex items-center gap-1.5 text-[13px] text-left min-h-[24px]">
          <span className={cn(amount != null ? 'text-foreground' : 'text-muted-foreground')}>
            {formatSalary(amount, currency, period)}
          </span>
          <PencilIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          {saved && <span className="text-[11px] text-[var(--green)] font-medium">Saved ✓</span>}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update the `InlineSalaryField` usage in `ProfileLogistics`**

Replace:

```tsx
<InlineSalaryField
  value={candidate.salary}
  onSave={(v) => updateCandidate({ salary: v || null })}
/>
```

With:

```tsx
<InlineSalaryField
  amount={candidate.salary_amount}
  currency={candidate.salary_currency}
  period={candidate.salary_period}
  onSave={(amt, cur, per) =>
    updateCandidate({ salary_amount: amt, salary_currency: cur, salary_period: per })
  }
/>
```

- [ ] **Step 4: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1 | grep "ProfileLogistics"
```

Expected: no errors.

---

### Task 7: Update display consumers

**Files:**

- Modify: `src/components/cards/CardBody.tsx`
- Modify: `src/components/briefing/BriefCard.tsx`
- Modify: `src/pages/SchedulePage.tsx`
- Modify: `src/lib/compare.ts`
- Modify: `src/lib/exports.ts`
- Modify: `src/lib/systemPrompt.ts`

All six files replace `candidate.salary` with `formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period)`.

- [ ] **Step 1: Update `CardBody.tsx`**

Add import:

```typescript
import { formatSalary } from '@/lib/salary'
```

Replace:

```typescript
{ label: 'Salary Expectation', value: candidate.salary },
```

With:

```typescript
{
  label: 'Salary Expectation',
  value: formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period),
},
```

- [ ] **Step 2: Update `BriefCard.tsx`**

Add import:

```typescript
import { formatSalary } from '@/lib/salary'
```

Replace `candidate.salary` with `formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period)` wherever it appears.

- [ ] **Step 3: Update `SchedulePage.tsx`**

Add import:

```typescript
import { formatSalary } from '@/lib/salary'
```

Replace the salary column cell that shows `candidate.salary` or `row.original.candidate.salary` with:

```tsx
{
  formatSalary(
    row.original.candidate.salary_amount,
    row.original.candidate.salary_currency,
    row.original.candidate.salary_period,
  )
}
```

- [ ] **Step 4: Update `compare.ts`**

Add import:

```typescript
import { formatSalary } from '@/lib/salary'
```

Replace:

```typescript
{ label: 'Salary', a: candidateA.salary ?? '—', b: candidateB.salary ?? '—' },
```

With:

```typescript
{
  label: 'Salary',
  a: formatSalary(candidateA.salary_amount, candidateA.salary_currency, candidateA.salary_period),
  b: formatSalary(candidateB.salary_amount, candidateB.salary_currency, candidateB.salary_period),
},
```

- [ ] **Step 5: Update `exports.ts`**

Add import:

```typescript
import { formatSalary } from '@/lib/salary'
```

Replace all `candidate.salary` references with `formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period)`.

- [ ] **Step 6: Update `systemPrompt.ts`**

Add import:

```typescript
import { formatSalary } from '@/lib/salary'
```

Replace `candidate.salary` with `formatSalary(candidate.salary_amount, candidate.salary_currency, candidate.salary_period)`.

- [ ] **Step 7: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors across the whole project.

---

### Task 8: Update `SalaryPage.tsx`

**Files:**

- Modify: `src/pages/SalaryPage.tsx`

- [ ] **Step 1: Rewrite `SalaryPage.tsx`**

```typescript
import { useCandidates } from '@/hooks/useCandidates'
import { formatSalary, salaryToEGP, sortBySalary } from '@/lib/salary'
import { Spinner } from '@/components/ui/spinner'

export function SalaryPage() {
  const { data, loading } = useCandidates()

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-7" />
      </div>
    )

  const sorted = sortBySalary(data.map((d) => d.candidate), (c) => c)

  const maxVal = Math.max(
    ...sorted.map((c) =>
      salaryToEGP(c.salary_amount, c.salary_currency, c.salary_period) ?? 0,
    ),
    1,
  )

  return (
    <div>
      <h1 className="text-[30px] font-medium tracking-[-0.025em] mb-1 text-text">Salary Chart</h1>
      <p className="text-text2 text-[13.5px] mb-6">
        All values normalised to monthly EGP equivalent (USD × 50). TBD excluded from ranking.
      </p>

      <div className="bg-surface border border-border rounded-[var(--radius)] p-6 shadow-[var(--shadow-sm)]">
        {sorted.map((candidate, i) => {
          const egp = salaryToEGP(
            candidate.salary_amount,
            candidate.salary_currency,
            candidate.salary_period,
          )
          const pct = egp ? Math.round((egp / maxVal) * 100) : 0
          const colors = [
            'var(--green)',
            'var(--blue)',
            'var(--brand)',
            'var(--purple)',
            'var(--amber)',
          ]
          const color = colors[i % colors.length]
          const label = formatSalary(
            candidate.salary_amount,
            candidate.salary_currency,
            candidate.salary_period,
          )

          return (
            <div key={candidate.id} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[11.5px] text-text w-44 flex-shrink-0 truncate font-medium">
                {candidate.name}
              </span>
              <div className="flex-1 h-5 bg-surface2 rounded-[6px] overflow-hidden relative border border-border">
                {egp ? (
                  <>
                    <div
                      className="h-full rounded-[5px] transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-semibold font-mono text-text2">
                      {label}
                    </span>
                  </>
                ) : (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-text3">
                    {label}
                  </span>
                )}
              </div>
              {egp && (
                <span className="text-[12px] font-mono text-text3 w-24 text-right flex-shrink-0">
                  ~{Math.round(egp / 1000)}K EGP
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

- [ ] **Step 2: Verify TypeScript**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors.

---

### Task 9: Re-seed candidates data

**Files:**

- Modify: `supabase/seed/data/candidates.ts`

- [ ] **Step 1: Replace `salary` string with three structured fields in every candidate**

All salaries are monthly unless noted. USD rate assumed at 50 EGP.

```typescript
// Replace the salary field in each candidate entry:
// Mina Taallap Shawkei
salary_amount: 90000, salary_currency: 'EGP', salary_period: 'month',   // was "85K-100K EGP"

// Lamia Mostafa
salary_amount: 60000, salary_currency: 'EGP', salary_period: 'month',   // was "60,000 EGP"

// Malak Abdelghaffar
salary_amount: 3000, salary_currency: 'USD', salary_period: 'month',    // was "~$3,000/month"

// Marwan Elwan
salary_amount: 3100, salary_currency: 'USD', salary_period: 'month',    // was "$3,000-$3,200/month"

// Kareem Ragab
salary_amount: 137500, salary_currency: 'EGP', salary_period: 'month', // was "125K-150K EGP"

// Mohamed Adel Eltabakh
salary_amount: 90000, salary_currency: 'EGP', salary_period: 'month',  // was "85K-100K EGP"

// Moaaz Tarek
salary_amount: 85000, salary_currency: 'EGP', salary_period: 'month',  // was "~85,000 EGP"

// Hadeer Mohamed Saeed
salary_amount: 100000, salary_currency: 'EGP', salary_period: 'month', // was "90K-110K EGP"

// Eman Wed Abdullah
salary_amount: 3200, salary_currency: 'USD', salary_period: 'month',   // was "$3,200/month"

// Aliaa Magdy Elfeky
salary_amount: null, salary_currency: null, salary_period: null,        // was "TBD"

// Loay Hamdy Omar
salary_amount: 87500, salary_currency: 'EGP', salary_period: 'month',  // was "85K-90K EGP"

// Zainab Gehad Talaat
salary_amount: 1925, salary_currency: 'USD', salary_period: 'month',   // was "$1,850-$2,000/month"

// Amr Mekawy
salary_amount: 150000, salary_currency: 'EGP', salary_period: 'month', // was "150,000 EGP"

// Abdulrahman Nasser
salary_amount: null, salary_currency: null, salary_period: null,        // was "TBD"

// Mostafa El Toukhy
salary_amount: null, salary_currency: null, salary_period: null,        // was "TBD"

// Bavly Ossam
salary_amount: 70000, salary_currency: 'EGP', salary_period: 'month',  // was "70,000 EGP"

// Nada Ahmed Abdel Kader
salary_amount: 120000, salary_currency: 'EGP', salary_period: 'month', // was "115K-125K EGP"

// Mostafa Mahmoud
salary_amount: null, salary_currency: null, salary_period: null,        // was "TBD"

// Omar Maged Youssef
salary_amount: 115000, salary_currency: 'EGP', salary_period: 'month', // was "115,000 EGP"

// George Fekry
salary_amount: 94000, salary_currency: 'EGP', salary_period: 'month',  // was "94,000 EGP"
```

Remove the `salary` field entirely from each candidate object and add the three fields above.

---

### Task 10: Apply migration and re-seed

- [ ] **Step 1: Apply migration**

```bash
npx supabase db push --linked
```

Expected: migration `012_salary_structured` applied successfully.

- [ ] **Step 2: Re-seed**

```bash
yarn seed
```

Expected: `Seed complete.`

- [ ] **Step 3: Full TypeScript check**

```bash
yarn tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 4: Verify in browser**

1. Open `http://localhost:5173/cards` — candidate cards show structured salary e.g. "90,000 EGP/month"
2. Open any profile → Overview → click Salary — edit mode pre-fills amount + currency + period
3. Open Salary Chart tab — bars render correctly with structured data

---

## Self-Review

**Spec coverage:**

- ✅ Drop `salary` text column — Task 1
- ✅ Add `salary_amount`, `salary_currency`, `salary_period` — Task 1
- ✅ DB types updated — Task 2
- ✅ `formatSalary` and `salaryToEGP` utility — Task 3
- ✅ Create form uses structured inputs — Tasks 4 + 5
- ✅ Profile edit uses structured fields with pre-fill — Task 6
- ✅ All display consumers updated — Task 7
- ✅ Salary chart uses structured data — Task 8
- ✅ Re-seeded with integer values — Task 9
- ✅ Migration applied and verified — Task 10

**Placeholder scan:** None found. All salary values in Task 9 are explicit integers.

**Type consistency:** `salary_amount: number | null`, `salary_currency: string | null`, `salary_period: string | null` used consistently. `CreateCandidateInput` uses `salaryAmount: string`, `salaryCurrency: 'EGP' | 'USD'`, `salaryPeriod: 'month' | 'year'`. `InlineSalaryField.onSave` takes `(amount: number, currency: string, period: string)`. `sortBySalary` generic matches the three-field shape. All consistent.
