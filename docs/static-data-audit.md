# Static Data Audit — DB Migration Candidates

All hardcoded data in the codebase that should eventually be driven by the database. Organized by priority.

---

## 🔴 Critical — affects data ownership / multi-user correctness

### 1. Interviewer identities

**Files:** `src/lib/scoring.ts`, `src/components/cards/Comments.tsx`, `src/components/cards/Scorecard.tsx`, `src/hooks/useCandidateState.ts`

The two scorer slots are hardcoded as `'peter'` and `'ossama'` — both as DB column names (`peter_scores`, `ossama_scores`, `peter_comment`, `ossama_comment`) and as display names. Any third interviewer gets forced into one of these two slots.

**Migration path:** Replace `peter_scores`/`ossama_scores` columns with a separate `scores` table keyed by `candidate_id + user_id`.

---

### 2. Score categories

**File:** `src/lib/scoring.ts`

```ts
const SCORE_CATEGORIES = ['Communication', 'Technical', 'Culture Fit', 'Leadership', 'Overall']
```

Different roles may need different evaluation dimensions.

**Migration path:** `score_categories` table per hiring round.

---

### 3. Verdict options (duplicated in 6+ files)

**Files:** `src/components/cards/StatusVerdictButtons.tsx`, `src/components/cards/ShortlistComparison.tsx`, `src/components/analysis/RankingTable.tsx`, `src/lib/exports.ts`, `src/lib/emailDraft.ts`

Labels (`Strong Yes / Yes / Maybe / No`), values (`strong-yes / yes / maybe / no`), colors, and emoji markers are duplicated across files with no single source of truth.

**Migration path:** `verdicts` config table; or at minimum a single shared constant in `src/lib/verdicts.ts`.

---

### 4. Checklist items

**File:** `src/components/cards/Checklist.tsx`

```ts
const CHECKLIST_ITEMS = [
  'CV reviewed',
  'LinkedIn checked',
  'Questions prepared',
  'Salary discussed',
  'Notice period confirmed',
]
```

**Migration path:** `checklist_items` table per hiring round.

---

## 🟠 High — round/config data that changes each hiring cycle

### 5. Round name + dates

**Files:** `src/components/layout/Header.tsx`, `src/components/auth/LoginPage.tsx`, `src/pages/SchedulePage.tsx`, `src/lib/exports.ts`

```
"Senior PM · May 17–21"
"May 2026 Hiring Round"
"intella-hiring-may-2026.xlsx"
```

All need to be updated manually for every new round.

---

### 6. Interview schedule days

**File:** `src/lib/filters.ts`

```ts
const DAY_MAP = {
  sun: 'Sunday 17 May',
  mon: 'Monday 18 May',
  tue: 'Tuesday 19 May',
  wed: 'Wednesday 20 May',
  thu: 'Thursday 21 May',
}
```

---

### 7. Email templates

**File:** `src/lib/emailDraft.ts`

Four email bodies hardcoded with "Senior PM role", "Peter Ehab, CPO", and "Intella" — not reusable across rounds or roles.

---

### 8. AI system prompt

**File:** `src/lib/systemPrompt.ts`

Company name, product description, role requirements, interview dates, and candidate count are all hardcoded strings inside the prompt.

---

### 9. Access domain

**Files:** `src/components/auth/LoginPage.tsx` (`DOMAIN`), `src/hooks/useAuth.ts` (`endsWith('@intellaworld.com')`)

Hardcoded in 3 places. Should be an env var or a `config` table entry.

---

## 🟡 Medium — lower urgency

### 10. USD → EGP conversion rate

**File:** `src/lib/salary.ts`

```ts
const USD_TO_EGP = 50
```

Exchange rates change. Should be a configurable value (env var or config table with effective date).

---

### 11. AI provider list

**File:** `src/lib/chat.ts`

```ts
const PROVIDER_LABELS = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT-4o mini)',
  google: 'Google (Gemini 2.0)',
}
```

Model names go stale. Should be a config table or env-driven.

---

### 12. Login preview cards

**File:** `src/components/auth/LoginPage.tsx`

7 fake candidate cards (`PREVIEW_CARDS`) in the animated aside are hardcoded. Could be pulled from real anonymized data or a seed table.

---

### 13. Export filenames + report titles

**File:** `src/lib/exports.ts`

```
"Intella Hiring Round — Decision Report"
"Senior PM · May 17–21, 2026"
"intella-hiring-may-2026.xlsx"
```

Should be generated from the active hiring round record.

---

## Recommended migration order

| Step | What                           | Unlocks                                                                      |
| ---- | ------------------------------ | ---------------------------------------------------------------------------- |
| 1    | `hiring_rounds` table          | Items 5, 6, 7, 8, 9, 13 — everything round-specific in one place             |
| 2    | Centralize verdict constants   | Item 3 — eliminate duplication across 6 files now, DB later                  |
| 3    | `score_categories` per round   | Item 2                                                                       |
| 4    | `checklist_items` per round    | Item 4                                                                       |
| 5    | `scores` table with `user_id`  | Item 1 — the biggest schema change; decouples from peter/ossama column names |
| 6    | Config table for domain + rate | Items 9, 10                                                                  |
