# Candidate Profile — Full Visibility & Editing

**Date:** 2026-05-19
**Status:** Approved

## Problem

Fields filled during candidate creation (3-step AddCandidateDrawer) are not all visible or editable in the candidate profile modal. Specifically:

- From `candidates` table: interview type, seniority, salary, notice period, and interview date/time are either not shown in the modal at all (type, seniority, date/time) or only visible on the card (salary, notice).
- From `candidate_analysis`: grad year, master's degree, domains, experience flags (AI/B2B/B2C/FinTech), and notable are stored but never surfaced anywhere in the profile modal.
- Nothing in the profile modal is currently editable.

## Goals

1. Every field from the creation form is visible in the candidate profile modal.
2. Simple fields (salary, notice, seniority, type, date/time) are click-to-edit inline.
3. Complex field groups (profile snapshot, background) are editable via a per-section expand/collapse form triggered by a pencil icon.

## Non-Goals

- Editing the candidate's name or email (identity fields).
- Editing AI-generated weaknesses or career history.
- Any changes to the AddCandidateDrawer itself.

---

## Overview Tab Redesign

The `ProfileOverview` component is restructured into three sections from top to bottom:

### Section 1 — Logistics (new, top)

Displays fields from the `candidates` table. Each value is click-to-edit inline.

| Field          | DB column       | Input type                                  |
| -------------- | --------------- | ------------------------------------------- |
| Salary         | `salary`        | Text input                                  |
| Notice period  | `notice`        | Select (same options as creation form)      |
| Seniority      | `seniority`     | Segmented toggle (Intern/Junior/Mid/Senior) |
| Interview type | `type`          | Segmented toggle (Remote/In-person)         |
| Interview date | `day` + `slot`  | Date input                                  |
| Interview time | `time` + `slot` | Time input                                  |

**Click-to-edit behavior:** Clicking a displayed value replaces it with an input. Saving fires on blur or Enter. A brief "Saved ✓" flash confirms success. Escape cancels without saving. Saves to `candidates` table via `useUpdateCandidate`.

### Section 2 — Profile Snapshot (existing, with edit)

Currently shown: fit score badge, summary, fit breakdown bars, strengths, weaknesses (AI-generated, read-only), watch-for.

A pencil icon on the section header expands all editable fields into a form (same fields as StepProfile):

- Brief summary (textarea)
- Strengths (chip input)
- Watch for in interview (textarea)
- Overall fit score (slider 0–100)
- Domain scores: AI/Tech, FinTech, B2B, Seniority (sliders 0–5)

Save/Cancel buttons appear at the bottom of the expanded section. Saves to `candidate_profiles` via `useUpdateCandidateProfile`. On save the `fit_label` is recomputed client-side using `fitLabelFromScore`.

### Section 3 — Background (existing + missing fields added, with edit)

Currently shown: university, degree, total exp, PM exp, current role, current company (read-only grid).

Missing fields added to the display grid:

- Grad year
- Master's degree (boolean badge)
- Domains (chip list)
- Experience flags: AI/ML, B2B, B2C, FinTech (boolean badges)
- Notable (text block)

A pencil icon on the section header expands all fields into a form (same fields as StepBackground):

- University, Degree, Grad year, Master's (checkbox)
- Total experience, Role-relevant experience
- Domains (chip input)
- Experience flags (check items)
- Notable (textarea)

Note: Current role and current company in `candidate_analysis` are derived from `title`/`company` in `candidate_profiles` at creation time. They are shown read-only here and stay in sync via the Profile Snapshot edit above.

Save/Cancel buttons at the bottom. Saves to `candidate_analysis` via `useUpdateCandidateAnalysis`.

---

## New Hooks

### `useUpdateCandidate(candidateId)`

- Mutation: `supabase.from('candidates').update(patch).eq('id', candidateId)`
- On success: invalidates `['candidates']` and `['candidate-meta']`

### `useUpdateCandidateProfile(candidateId)`

- Mutation: `supabase.from('candidate_profiles').update(patch).eq('candidate_id', candidateId)`
- On success: invalidates `['candidates']`

### `useUpdateCandidateAnalysis(candidateId)`

- Mutation: `supabase.from('candidate_analysis').update(patch).eq('candidate_id', candidateId)`
- On success: invalidates `['candidates']`

---

## Component Changes

### `ProfileModal.tsx`

- Pass `candidate` (the `candidates` row) down to `ProfileOverview` as a new prop.

### `ProfileOverview.tsx`

- Accept `candidate` as a new required prop alongside the existing `profile` and `analysis`.
- Restructure into the three sections described above.
- Use `useUpdateCandidate`, `useUpdateCandidateProfile`, `useUpdateCandidateAnalysis` internally.
- Extract an `InlineEditField` component for the click-to-edit behavior (text, select, segmented toggle variants).
- Extract a `SectionEditForm` component for the expand/collapse section edit pattern.

### No new files

All new hooks go in `src/hooks/`. `InlineEditField` and `SectionEditForm` can live inside `ProfileOverview.tsx` or be extracted to `src/components/profile/` if they grow large.

---

## Data Integrity Notes

- `candidates.slot` is a combined ISO datetime string (`YYYY-MM-DDTHH:mm`). When saving date or time independently, reconstruct `slot` from the current values of both before sending.
- `candidates.day` is the day name (e.g. "Monday"). Recompute from the date whenever the date changes.
- `candidate_profiles.fit_label` must be recomputed via `fitLabelFromScore` whenever `fit_score` changes. Do not store a stale label.
- `candidate_analysis.current_role` and `current_company` are not editable from the Background section — they mirror `candidate_profiles.title`/`company` and are updated when the Profile Snapshot is saved.
