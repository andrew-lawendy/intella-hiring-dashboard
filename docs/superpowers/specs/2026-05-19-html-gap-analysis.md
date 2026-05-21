# HTML Mockup Gap Analysis — Design Spec

**Date:** 2026-05-19
**Status:** Approved for phased implementation

## Background

Compared the live React app at `localhost:5173` against `Intella Dashboard.html` (the original single-page prototype) to identify features that were designed but not yet built. Three phases were identified.

---

## What the live app already has (not missing)

- Schedule, Compare, Questions, Salary Chart, Day Briefing, AI Assistant — all present and equivalent
- Profile: CV upload/view tab, History/audit log tab — added in the React app, not in HTML
- Analysis: Interviewer Accountability section — added in the React app, not in HTML
- Notifications bell — equivalent to the HTML's inline alert banners

---

## Phase 1 — Analysis Page Enhancements

### Goal

The HTML Analysis tab has 7 sections. Our app has 4. Three full sections and several charts are missing.

### What the HTML has that we don't

#### 1.1 — PM Experience bar chart

A horizontal bar chart showing years in Product Management per candidate — separate from the Total Experience chart already in the app. Same styling as the existing `HorizontalBar` component.

Data source: `candidate_analysis.pm_exp`

#### 1.2 — Salary Comparison chart (inside Analysis)

A horizontal bar chart of all candidates sorted by salary (highest → lowest), colour-coded: red = premium, blue = mid, green = competitive. Uses EGP-normalised salary (`salaryToEGP`).

Data source: `candidates.salary_amount / salary_currency / salary_period`

#### 1.3 — Education section

Two charts side-by-side:

**Degree Type Distribution** — donut chart showing the split between degree types (BSc, BEng, BA, Masters, etc.) across all candidates. Data from `candidate_analysis.degree`.

**Graduation Year** — horizontal bar chart per candidate, colour-coded by year band: blue 2020+, amber 2016–2019, grey before 2016. Data from `candidate_analysis.grad_year`.

#### 1.4 — Domain & Skills Coverage section

Three donut charts in a row:

- **AI / Tech Experience** — Yes / No split across pool. Data: `candidate_analysis.ai_exp`
- **Fintech Experience** — Yes / No split. Data: `candidate_analysis.fintech`
- **B2B vs B2C Focus** — B2B / B2C / Both / Neither. Data: `candidate_analysis.b2b`, `candidate_analysis.b2c`

**Domain Heatmap** — a grid of coloured cells, one row per candidate, one column per domain keyword found across the pool. Cell is coloured if that candidate has that domain, grey otherwise. Hovering shows the candidate's name. Data: `candidate_analysis.domains[]`.

#### 1.5 — Full Comparison Table

A scrollable data table of all candidates with columns:

Name | Role | Fit Score | AI Exp | Fintech | B2B | PM Exp | Total Exp | University | Grad Year | Masters | Salary | Notice | Seniority

Each row is one candidate. Sortable by fit score descending by default. Clicking a name opens the profile modal.

Data from: all three tables (candidates, candidate_profiles, candidate_analysis).

#### 1.6 — Key Highlights

A grid of callout cards (min 320px wide, auto-fill) highlighting notable data points from the pool. Each card has a title and a short insight. Examples:

- "Highest fit score" → name + score
- "Most PM experience" → name + years
- "Only AI/ML candidate" → name
- "Fastest available" (immediate notice) → names
- "Salary range" → min to max

Generated at render time from the data — no hardcoded text.

#### 1.7 — Expandable Candidate Ranking

The existing `RankingTable` shows a static list. The HTML version has expandable cards — clicking a candidate card reveals their pros, cons, and watch-for inline. Replace the current table with expandable cards.

---

## Phase 2 — Cards Page Day-of-Week Filters

### Goal

Add day-of-week filter buttons alongside the existing status/seniority filters so users can quickly see only Sunday's or Wednesday's candidates.

### What to add

A row of day filter chips derived dynamically from the actual `interview_at` values in the database. Only days that have at least one scheduled candidate are shown. Labels come from `formatInterviewDate(interview_at)` (e.g. "Sun 17 May 2026"), shortened to "Sun 17" in the chip.

The "Today" chip is highlighted if the current date matches one of the interview days.

Day filters compose with the existing status/seniority filters (both active simultaneously).

### Dynamic derivation

```typescript
// Derive unique interview days from candidate data
const interviewDays = Array.from(
  new Set(
    candidates.filter((c) => c.interview_at).map((c) => interviewAtToDateInput(c.interview_at)), // YYYY-MM-DD
  ),
).sort()
```

Each day chip label is computed via `formatInterviewDate` so it always reflects the real data — no hardcoded dates.

---

## Phase 3 — Profile Modal: AI Insight Tab

### Goal

Add a 7th tab to the candidate profile modal — "AI Insight" — that generates a Claude-powered assessment of the candidate's fit for the role on demand.

### Tab behaviour

- Default state: shows a "Generate AI Assessment" button with a brief description ("Live Claude assessment of [Name]'s fit for the Intella Senior PM role").
- On click: streams or displays a Claude-generated narrative covering:
  - Summary of the candidate's strengths and fit signals
  - Key risks or gaps for the specific role
  - Recommendation (strong hire / worth interviewing / borderline / pass)
- Once generated, the result is displayed in a readable card. A "Regenerate" button allows refreshing.
- The assessment is NOT persisted to the database — it is generated fresh each session. (Can be upgraded to cached later.)

### Data sent to Claude

- Candidate name, role, company, summary, strengths, weaknesses, watch-for
- Fit score and domain scores
- Education: university, degree, grad year, masters
- Experience: total exp, PM exp, domains, experience flags
- The job description / role context (from the existing `app_config` or hardcoded for the Senior PM role)

### Dependencies

- Requires a Claude API key configured in the app (currently handled via the existing AI Assistant chat — can reuse the same key infrastructure).
- The tab should show a "Configure API key" prompt if no key is set, identical to the existing chat tab behaviour.

---

## Phasing & Priority

| Phase                      | Impact                            | Effort      | Suggested order |
| -------------------------- | --------------------------------- | ----------- | --------------- |
| 1 — Analysis enhancements  | High (data-rich, differentiating) | Medium-High | First           |
| 2 — Day filters on Cards   | Medium (UX convenience)           | Low         | Second          |
| 3 — AI Insight profile tab | High (AI-native feature)          | Medium      | Third           |

Each phase produces a self-contained, reviewable set of changes. Phase 1 can be broken into sub-tasks per section.
