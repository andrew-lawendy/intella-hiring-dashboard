# Intella Hiring Dashboard — React Migration Design Spec

**Date:** 2026-05-15
**Author:** Andrew Lawendy
**Status:** Approved for implementation

---

## 1. Overview

Migrate the existing single-file HTML interview dashboard (`Intella Dashboard.html`, 4.5MB) to a production-grade React application. The goal is a faithful 1:1 migration of all current functionality and visual design, with a proper data backend, authentication, and an extensible architecture for future features.

**What this replaces:** A static HTML file deployed on Netlify. All state lives in `localStorage`. CVs are embedded as base64 PDFs inside the file. No auth, no server-side persistence, no multi-device access.

**What we're building:** A React SPA with Supabase as the data layer, Google OAuth authentication restricted to `@intellaworld.com`, CV storage in Supabase Storage, and deployment on Netlify.

---

## 2. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 19 + Vite | Latest React, fast dev server |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS v4 | Utility-first, maps cleanly to existing CSS tokens |
| Components | shadcn/ui | Accessible, unstyled-by-default, composable |
| Routing | React Router v6 | One route per tab for deep-linking and browser history |
| Database | Supabase (Postgres) | Managed Postgres, RLS, easy migration to self-hosted |
| Auth | Supabase Auth + Google OAuth | Restrict sign-in to `@intellaworld.com` |
| File storage | Supabase Storage | CV PDFs, private bucket with signed URLs |
| Hosting | Netlify | Existing deployment, Netlify Functions for Claude proxy |
| Testing | Vitest + React Testing Library | Unit tests per phase |
| Linting | ESLint + Prettier | Code quality |
| Git hooks | Husky + lint-staged + commitlint | Enforce quality on every commit |

---

## 3. Authentication

- **Provider:** Google OAuth via Supabase Auth
- **Domain restriction:** Only emails ending in `@intellaworld.com` can sign in. All other Google accounts are rejected at the auth callback.
- **Implementation:** Supabase Auth callback checks `email` domain. If not `@intellaworld.com`, session is destroyed and user is shown an error screen.
- **Route protection:** All app routes are behind an auth guard. Unauthenticated users are redirected to `/login`.
- **Login screen:** Simple centered card with Intella logo + "Sign in with Google" button.
- **Session:** Supabase handles token refresh automatically.

---

## 4. Data Model

All static data (currently hardcoded in JS) and mutable state (currently in `localStorage`) moves to Supabase.

### 4.1 Tables

**`candidates`**
```
id          text PRIMARY KEY   -- slug (e.g., "mina", "marwan")
name        text NOT NULL
email       text NOT NULL
slot        text               -- "Sun 17 May 11:00-12:00"
day         text               -- "Sunday 17 May"
time        text               -- "11:00 - 12:00"
type        text               -- "In-person" | "Remote"
salary      text
notice      text
created_at  timestamptz DEFAULT now()
```

**`candidate_profiles`**
```
candidate_id    text PRIMARY KEY REFERENCES candidates(id)
title           text
company         text
summary         text
strengths       text[]
weaknesses      text[]
fit_score       integer
fit_label       text
fit_color       text            -- CSS variable reference
ai_score        integer
fintech_score   integer
b2b_score       integer
seniority_score integer
custom_questions text[]
watch_for       text
career          jsonb           -- [{year, role, company, desc}]
```

**`candidate_analysis`**
```
candidate_id    text PRIMARY KEY REFERENCES candidates(id)
university      text
degree          text
grad_year       integer
masters         text
total_exp       integer
pm_exp          integer
current_role    text
current_company text
domains         text[]
ai_exp          boolean
b2b             boolean
b2c             boolean
fintech         boolean
notable         text
```

**`interview_state`**
```
candidate_id        text PRIMARY KEY REFERENCES candidates(id)
confirmed           boolean DEFAULT false
shortlisted         boolean
interview_status    text DEFAULT 'pending'  -- 'pending' | 'in-progress' | 'completed'
verdict             text                    -- 'strong-yes' | 'yes' | 'maybe' | 'no' | null
peter_scores        jsonb DEFAULT '{}'      -- {Communication, Technical, Culture Fit, Leadership, Overall}
ossama_scores       jsonb DEFAULT '{}'
peter_comment       text DEFAULT ''
ossama_comment      text DEFAULT ''
checklist           jsonb DEFAULT '{}'      -- {item: boolean}
photo_url           text
updated_at          timestamptz DEFAULT now()
```

**`interview_questions`**
```
id          serial PRIMARY KEY
position    integer             -- display order
title       text
duration    text
goal        text
color       text                -- CSS variable reference
bg          text                -- CSS variable reference
questions   text[]
```

**`audit_log`**
```
id              bigserial PRIMARY KEY
candidate_id    text REFERENCES candidates(id)
changed_by      text NOT NULL       -- email of the user who made the change
field           text NOT NULL       -- 'verdict' | 'shortlisted' | 'interview_status' | 'confirmed' | 'peter_scores' | 'ossama_scores' | etc.
old_value       text
new_value       text
created_at      timestamptz DEFAULT now()
```

Every verdict, shortlist, reject, status change, and scorecard submission writes a row here automatically via a Supabase trigger on `interview_state`. The app also writes explicit log entries for user-initiated actions (e.g., dismissing an alert banner does not log; setting a verdict does).

### 4.2 Row Level Security

All tables have RLS enabled. Policy: authenticated users with an `@intellaworld.com` email can SELECT, INSERT, UPDATE on all rows. No DELETE exposed to the app (soft deletes only if needed).

### 4.3 Storage

- **Bucket:** `candidate-cvs` (private)
- **File naming:** `{candidate_id}.pdf`
- **Access:** Signed URLs with 1-hour expiry, generated server-side when the CV viewer opens
- **Seed:** The 20 CV PDFs are extracted from the HTML's base64 `CV_DATA` object and uploaded during the data seeding phase

### 4.4 API Key

The Anthropic API key remains user-entered (stored in `localStorage` under `intella_api_key`). This matches current behavior. A future phase can move it to a Netlify environment variable.

---

## 5. Routing

| Route | Tab |
|---|---|
| `/login` | Login screen |
| `/` | Redirect to `/cards` |
| `/cards` | Candidate Cards |
| `/schedule` | Schedule |
| `/compare` | Compare |
| `/questions` | Questions |
| `/salary` | Salary Chart |
| `/briefing` | Day Briefing |
| `/analysis` | Analysis |
| `/chat` | AI Assistant |

All routes except `/login` are wrapped in an `<AuthGuard>` component that redirects unauthenticated users.

---

## 6. Color Token System

The existing CSS custom properties from the HTML are ported 1:1 into a Tailwind v4 theme. All tokens are defined in `src/styles/tokens.css` and referenced as Tailwind utilities.

**Token groups:**
- Surfaces: `--bg`, `--surface`, `--surface2`, `--surface3`
- Borders: `--border`, `--border-strong`
- Text: `--text`, `--text2`, `--text3`, `--text4`
- Brand: `--accent`, `--brand`, `--brand-soft`
- Semantic: `--green`, `--green-bg`, `--green-line`, `--amber`, `--amber-bg`, `--amber-line`, `--red`, `--red-bg`, `--red-line`, `--blue`, `--blue-bg`, `--blue-line`, `--purple`, `--purple-bg`, `--purple-line`
- Radii: `--r`, `--rs`, `--rxs`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Fonts: `--font-sans`, `--font-mono`, `--font-serif`

Both `[data-theme="light"]` and `[data-theme="dark"]` variants are defined.

---

## 7. Dark / Light / System Mode

Dark mode is a **3-way toggle**: Light, Dark, System.

- **Light:** sets `data-theme="light"` on `<html>`
- **Dark:** sets `data-theme="dark"` on `<html>`
- **System:** reads `prefers-color-scheme` via `window.matchMedia`. Adds a listener — if the OS theme changes while the app is open, the app updates automatically. Sets `data-theme` to match the current OS preference.

Preference is persisted in `localStorage` under `intella_theme`. On app load, the saved preference is applied before first render to avoid flash.

---

## 8. Feature Inventory (tabs)

### 8.1 Cards Tab
- Summary stats bar (5 KPIs: total, confirmed, shortlisted, pending, completed)
- Interview timeline (5 days, past/today/future states, progress bars)
- **Action queue panel** — collapsible panel above the card grid listing candidates that need attention: unsubmitted scorecards, missing confirmations, interviews marked Done with no verdict set. One-click jump to the relevant card.
- Filter pills: All, Shortlisted, Pending, Rejected + search input
- Candidate card grid (responsive, `auto-fill minmax(340px, 1fr)`)
- Per card:
  - Status banner (Shortlisted / Rejected / Todo)
  - Header: avatar (initials + pseudo-random gradient), name, email, badges (confirmed/pending/remote), confirmation toggle button
  - Body: slot, type, salary, notice period (info rows)
  - Scorecard: Peter + Ossama star ratings (5 categories), combined score, active scorer toggle
    - **Feedback blinding:** each interviewer can only see and edit their own scores. The co-interviewer's scores are hidden behind a "Reveal scores" button that only unlocks once the current user has submitted all 5 of their own ratings. Hard-enforced in the UI — no way to peek before submitting.
    - **Scorecard overdue indicator:** if interview status is "Done" and the active user's scorecard has all-zero scores after 24 hours, the scorecard section shows a visible amber "Overdue" badge.
  - Checklist: 5 items with checkboxes
  - Comments: Peter + Ossama text areas with save button
  - Actions: Shortlist, Reject, View Profile, Email Draft, Print Brief
  - Interview status buttons (Not Started / In Progress / Done)
  - Verdict buttons (Strong Yes / Yes / Maybe / No)
  - **Audit trail line:** small "last updated" line at the bottom of each card (e.g., "Shortlisted by peter@intellaworld.com · 2h ago"). Links to full history in the profile modal.

### 8.2 Schedule Tab
Table view of all candidates with: name, slot, type, confirmation toggle, CV button, status select.

### 8.3 Compare Tab
Two dropdowns to select any two candidates. Side-by-side comparison of all profile fields, scores, and verdicts.

### 8.4 Questions Tab
7 interview question sections, each expandable. Color-coded by section. Duration and goal per section.

### 8.5 Salary Chart Tab
Horizontal bar chart comparing all candidate salary expectations. Sorted by value where possible.

### 8.6 Day Briefing Tab
Day filter (All + 5 days). Brief card per candidate with: time, name, email, key profile data, export PDF button, interview timer.

### 8.7 Analysis Tab
- KPI cards (total candidates, AI exp count, B2B count, avg experience, shortlisted count)
- Experience bar chart (candidates by total years)
- Domain frequency bar chart
- AI / B2B / Fintech donut charts
- Scatter plot (PM experience vs fit score)
- Salary distribution
- Full candidate ranking table (sortable by combined score, verdict, name)
- **Interviewer accountability panel:** per interviewer — average time from interview marked "Done" to scorecard submitted (pulled from `audit_log`), score distribution histogram (are they systematically high or low?), divergence from co-interviewer per candidate. Useful for post-round calibration.

### 8.8 AI Assistant Tab
- API key management banner (enter key, show masked, clear)
- Chat interface (user + AI message bubbles, thinking state)
- System prompt includes full candidate data context
- Uses `claude-sonnet-4-5` via Netlify Function proxy at `/api/claude/v1/messages`
- Chat history capped at last 20 messages
- Works on hosted URL (Netlify Function); falls back to direct browser API on localhost
- **Async debrief summary:** a dedicated "Generate Debrief" button (separate from the open-ended chat) that produces a structured cross-scorecard summary across all candidates with a completed interview: where Peter and Ossama aligned, where they diverged, top-ranked candidates with supporting evidence from scores and comments, and suggested talking points for the team debrief meeting. Output is formatted for easy copy/paste or printing.

### 8.9 Header (persistent)
- Intella logo
- Progress ring (completed interviews / total, animated SVG)
- **Pipeline health snapshot:** compact inline stats next to the progress ring — % of scorecards filled, % with a verdict, days since round opened. Single-glance answer to "where does the round stand?" without scanning all 20 cards.
- Shortlist comparison modal button
- Decision Report PDF export button
- Export Excel button
- Print button
- Dark / Light / System mode toggle
- Alert banners (dismissible, per candidate with missing slot or unconfirmed status)

### 8.10 Profile Modal
Full-screen modal for any candidate. 5 tabs:
- **Overview:** summary, fit score, strengths, weaknesses, watch-for note, fit score bars (AI / Fintech / B2B / Seniority)
- **Career:** timeline of roles
- **Questions:** custom interview questions for this candidate
- **CV:** PDF viewer (via signed URL from Supabase Storage), photo URL input
- **History:** full chronological audit log for this candidate — every decision (verdict set, shortlisted, status changed, scorecard submitted) with who made it and when, sourced from `audit_log`.

### 8.11 Email Draft Modal
Pre-filled email based on verdict (Strong Yes / Yes / Maybe / No). Editable To, Subject, Body fields. "Open in Mail App" button generates `mailto:` link.

### 8.12 Export / Print
- **Export Excel:** XLSX file with all candidate data + scores + verdicts (uses `xlsx` library)
- **Decision Report PDF:** Opens a print-optimized HTML window with full ranking, scores, comments
- **Print Brief Card:** Per-candidate print window with profile summary and custom questions
- **Print stylesheet:** Hides nav/filters/actions, shows all tab content

---

## 9. Git Hooks (Husky)

Three hooks:

**pre-commit** (via lint-staged):
- ESLint autofix on staged `.ts` / `.tsx` files
- Prettier format on staged `.ts` / `.tsx` / `.css` / `.json` / `.md` files
- Commit is blocked if ESLint errors remain after autofix

**commit-msg** (via commitlint):
- Enforces Conventional Commits format: `type(scope): description`
- Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `build`, `ci`
- Example valid message: `feat(cards): add verdict buttons to candidate card`

**pre-push**:
- Runs `vitest run` — blocks push if any unit tests fail

---

## 10. Testing Strategy

Each phase ships with unit tests for the new code it introduces.

- **Phase 1:** No tests (pure config)
- **Phase 2:** Supabase client helpers, seed script utilities, audit log trigger
- **Phase 3:** Auth guard behavior, theme persistence logic, pipeline health snapshot calculations
- **Phase 4:** Score calculation (`totalScore`, `maxScore`), filter logic, checklist state, feedback blinding logic, action queue derivation
- **Phase 5:** Profile modal tab switching, email draft generation, audit history rendering
- **Phase 6:** Compare selector logic, salary sort/parse
- **Phase 7:** KPI calculations, ranking sort, interviewer accountability metrics
- **Phase 8:** Chat history capping, API key masking, debrief summary prompt construction

Tests use Vitest + React Testing Library. Supabase calls are mocked at the client boundary.

---

## 11. Netlify Configuration

`netlify.toml`:
- Build command: `vite build`
- Publish directory: `dist`
- Redirects: `/* → /index.html 200` (SPA fallback for React Router)
- Functions directory: `netlify/functions`

**Netlify Function: `claude.ts`**
Proxies POST requests from `/api/claude/v1/messages` to the Anthropic API. When the Anthropic API key is user-entered (current mode), the function forwards the `x-api-key` header from the client request. This avoids CORS issues in all browsers.

---

## 12. Future Considerations (out of scope for this migration)

- Move Anthropic API key to Netlify environment variable (removes user-entered key UI)
- Migrate Supabase to self-hosted Postgres on Intella's containers (one env var change)
- Real-time score sync between Peter and Ossama (Supabase Realtime)
- Multi-round support — add a `rounds` table and foreign-key all tables to it; the current schema supports one active hiring round at a time
- Role-based access (e.g., read-only view for other team members)
- Email sending integration (replace `mailto:` with direct send via SendGrid or similar)
