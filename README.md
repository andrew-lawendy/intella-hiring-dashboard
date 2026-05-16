# Intella Hiring Dashboard

A production-grade interview management dashboard for the Intella team. Migrated from a static HTML file to a full React application.

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** with custom design token system
- **shadcn/ui** (New York style) for base components
- **Supabase** — Postgres database, Google OAuth, file storage
- **Netlify** — hosting + serverless functions (multi-provider AI proxy: Claude, GPT-4o, Gemini)
- **xlsx** — client-side Excel export

## Local Development

### Prerequisites

- Node.js 20+
- Yarn
- A Supabase project (see [supabase.com](https://supabase.com))

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <repo-url>
   cd intella-hiring-dashboard
   yarn
   ```

2. Copy the environment template and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations and seed data (see `supabase/README.md`).

4. Start the dev server:
   ```bash
   yarn dev
   ```

## Available Scripts

| Script               | Description              |
| -------------------- | ------------------------ |
| `yarn dev`           | Start Vite dev server    |
| `yarn build`         | Production build         |
| `yarn lint`          | Run ESLint               |
| `yarn format`        | Run Prettier             |
| `yarn test`          | Run Vitest in watch mode |
| `yarn test:run`      | Run tests once           |
| `yarn test:coverage` | Run tests with coverage  |

## Commit Convention

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `build`, `ci`

Example: `feat(cards): add scorecard blinding to candidate card`

## Deployment

Deployed on Netlify. Every push to `main` triggers a production deploy. Environment variables are managed in the Netlify dashboard.

## Architecture

See [`docs/superpowers/specs/2026-05-15-react-migration-design.md`](docs/superpowers/specs/2026-05-15-react-migration-design.md) for the full design spec.

## Phases

| Phase | Description             | Status  |
| ----- | ----------------------- | ------- |
| 1     | Project Foundation      | ✅ Done |
| 2     | Auth & Data Layer       | ✅ Done |
| 3     | App Shell & Routing     | ✅ Done |
| 4     | Cards Tab               | ✅ Done |
| 5     | Profile Modal           | ✅ Done |
| 6     | Secondary Tabs          | ✅ Done |
| 7     | Day Briefing & Analysis | ✅ Done |
| 8     | AI Assistant & Exports  | ✅ Done |

## Features

- **Cards Tab** — candidate grid with filters, scorecard, feedback blinding, shortlist comparison
- **Profile Modal** — 5-tab deep-dive: Overview, Career, Questions, CV, History
- **Schedule Tab** — sorted interview timeline with confirmation toggles
- **Compare Tab** — side-by-side candidate comparison across 11 dimensions
- **Questions Tab** — accordion interview guide by section
- **Salary Chart** — horizontal bar chart with normalized EGP values
- **Day Briefing** — per-candidate brief card with interview timer and print export
- **Analysis Tab** — KPI cards, domain frequency, scatter plot, ranking table, interviewer accountability
- **AI Assistant** — chat with full candidate context via Claude, GPT-4o mini, or Gemini; AI debrief summary generator
- **Exports** — Excel download, printable decision report PDF, per-candidate brief print
