# Intella Hiring Dashboard

A production-grade interview management dashboard for the Intella team. Migrated from a static HTML file to a full React application.

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** with custom design token system
- **shadcn/ui** (New York style) for base components
- **Supabase** — Postgres database, Google OAuth, file storage
- **Netlify** — hosting + serverless functions (Claude AI proxy)

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

| Phase | Description             | Status     |
| ----- | ----------------------- | ---------- |
| 1     | Project Foundation      | ✅ Done    |
| 2     | Auth & Data Layer       | ⬜ Pending |
| 3     | App Shell & Routing     | ⬜ Pending |
| 4     | Cards Tab               | ⬜ Pending |
| 5     | Profile Modal           | ⬜ Pending |
| 6     | Secondary Tabs          | ⬜ Pending |
| 7     | Day Briefing & Analysis | ⬜ Pending |
| 8     | AI Assistant & Exports  | ⬜ Pending |
