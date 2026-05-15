# Phase 1: Project Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready Vite + React + TypeScript project with Tailwind v4, shadcn/ui, ESLint, Prettier, Vitest, Husky pre-commit hooks, and Netlify configuration — zero application functionality, just the skeleton every subsequent phase builds on.

**Architecture:** Single-page React app served by Vite. Tailwind v4 reads CSS custom properties for theming. shadcn/ui provides accessible base components. Quality is enforced at commit time via Husky hooks.

**Tech Stack:** React 19, Vite 6, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui (New York style), ESLint flat config, Prettier, Vitest + jsdom, Husky v9, lint-staged, commitlint (`@commitlint/config-conventional`), Netlify

---

### Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Scaffold the project into the existing directory**

Run from `/home/andrew-lawendy/my-repos/intella-hiring-dashboard/`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted about the non-empty directory, select **"Ignore files and continue"**.

- [ ] **Step 2: Install dependencies**
```bash
npm install
```

- [ ] **Step 3: Verify dev server starts**
```bash
npm run dev
```
Expected: Vite starts on `http://localhost:5173`. Browser shows default Vite+React page. Kill the server (Ctrl+C).

- [ ] **Step 4: Remove boilerplate, set minimal App**

Delete `src/assets/react.svg` and `public/vite.svg`.

Replace `src/App.tsx` with:
```tsx
export default function App() {
  return <div className="p-4">Intella Dashboard</div>
}
```

Delete `src/App.css`. Delete `src/index.css` (will be replaced in Task 2).

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "chore: scaffold vite react typescript project"
```

---

### Task 2: Configure Tailwind CSS v4 + Color Tokens

**Files:**
- Modify: `vite.config.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/globals.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install Tailwind v4**
```bash
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Add Tailwind plugin to Vite config**

Replace `vite.config.ts` with:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
})
```

- [ ] **Step 3: Create color token definitions**

Create `src/styles/tokens.css`:
```css
/* Light theme (default) */
[data-theme="light"], :root {
  --bg:           #f6f4ef;
  --surface:      #ffffff;
  --surface2:     #f1efe8;
  --surface3:     #e9e7df;
  --border:       #e4e1d8;
  --border-strong:#cfcbbf;

  --text:  #1a1816;
  --text2: #5d5b53;
  --text3: #92907f;
  --text4: #b9b6a8;

  --accent:     #1a1816;
  --brand:      #2a2479;
  --brand-soft: #ece9f7;

  --green:      oklch(0.46 0.10 155);
  --green-bg:   oklch(0.95 0.04 155);
  --green-line: oklch(0.46 0.10 155 / .25);

  --amber:      oklch(0.55 0.13 65);
  --amber-bg:   oklch(0.96 0.06 80);
  --amber-line: oklch(0.55 0.13 65 / .25);

  --red:        oklch(0.52 0.18 25);
  --red-bg:     oklch(0.96 0.04 25);
  --red-line:   oklch(0.52 0.18 25 / .25);

  --blue:       oklch(0.42 0.14 255);
  --blue-bg:    oklch(0.96 0.03 255);
  --blue-line:  oklch(0.42 0.14 255 / .25);

  --purple:      oklch(0.45 0.16 295);
  --purple-bg:   oklch(0.96 0.03 295);
  --purple-line: oklch(0.45 0.16 295 / .25);

  --shadow-sm: 0 1px 0 rgba(20,18,14,.03), 0 1px 2px rgba(20,18,14,.04);
  --shadow-md: 0 1px 0 rgba(20,18,14,.04), 0 6px 22px -8px rgba(20,18,14,.10);
  --shadow-lg: 0 1px 0 rgba(20,18,14,.04), 0 18px 60px -16px rgba(20,18,14,.22);
}

/* Dark theme */
[data-theme="dark"] {
  --bg:           #0e0e0c;
  --surface:      #16150f;
  --surface2:     #1c1b14;
  --surface3:     #26241c;
  --border:       #2a2820;
  --border-strong:#3a382f;

  --text:  #f1efe6;
  --text2: #b8b5a6;
  --text3: #7e7b6e;
  --text4: #545245;

  --accent:     #f1efe6;
  --brand:      oklch(0.75 0.13 270);
  --brand-soft: oklch(0.28 0.06 270);

  --green-bg:   oklch(0.27 0.06 155);
  --amber-bg:   oklch(0.27 0.07 65);
  --red-bg:     oklch(0.26 0.08 25);
  --blue-bg:    oklch(0.26 0.07 255);
  --purple-bg:  oklch(0.26 0.07 295);

  --shadow-sm: 0 1px 0 rgba(0,0,0,.5), 0 1px 2px rgba(0,0,0,.5);
  --shadow-md: 0 1px 0 rgba(0,0,0,.5), 0 8px 28px -10px rgba(0,0,0,.6);
  --shadow-lg: 0 1px 0 rgba(0,0,0,.5), 0 24px 72px -16px rgba(0,0,0,.7);
}
```

- [ ] **Step 4: Create globals.css with Tailwind import and theme mapping**

Create `src/styles/globals.css`:
```css
@import "tailwindcss";
@import "./tokens.css";

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

/* Map CSS custom properties to Tailwind theme tokens */
@theme inline {
  --color-bg:           var(--bg);
  --color-surface:      var(--surface);
  --color-surface2:     var(--surface2);
  --color-surface3:     var(--surface3);
  --color-border:       var(--border);
  --color-border-strong:var(--border-strong);
  --color-text:         var(--text);
  --color-text2:        var(--text2);
  --color-text3:        var(--text3);
  --color-text4:        var(--text4);
  --color-accent:       var(--accent);
  --color-brand:        var(--brand);
  --color-brand-soft:   var(--brand-soft);
  --color-green:        var(--green);
  --color-green-bg:     var(--green-bg);
  --color-green-line:   var(--green-line);
  --color-amber:        var(--amber);
  --color-amber-bg:     var(--amber-bg);
  --color-amber-line:   var(--amber-line);
  --color-red:          var(--red);
  --color-red-bg:       var(--red-bg);
  --color-red-line:     var(--red-line);
  --color-blue:         var(--blue);
  --color-blue-bg:      var(--blue-bg);
  --color-blue-line:    var(--blue-line);
  --color-purple:       var(--purple);
  --color-purple-bg:    var(--purple-bg);
  --color-purple-line:  var(--purple-line);

  --font-sans:  'DM Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:  'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-serif: 'Instrument Serif', ui-serif, Georgia, serif;

  --radius:    12px;
  --radius-sm: 8px;
  --radius-xs: 6px;

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
}

/* Base styles */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body { height: 100%; }

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  font-size: 13.5px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "cv11";
  transition: background 0.25s ease, color 0.25s ease;
}

::selection { background: var(--brand); color: #fff; }

/* Scrollbars */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; border: 2px solid var(--bg); }
::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 5: Import globals in main.tsx**

Replace `src/main.tsx` with:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Verify Tailwind tokens work**

Update `src/App.tsx` to test a token:
```tsx
export default function App() {
  return (
    <div className="bg-bg min-h-screen p-8">
      <p className="text-text font-sans text-lg">Intella Dashboard</p>
      <p className="text-text2 font-mono text-sm mt-2">Token test</p>
      <div className="mt-4 h-8 w-32 rounded-[var(--radius)] bg-brand" />
    </div>
  )
}
```

Run `npm run dev`. Expected: cream background, dark text, indigo rectangle. No Tailwind errors in console.

Kill the server.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "chore: configure tailwind v4 with color tokens"
```

---

### Task 3: Set Up shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/` (shadcn generates components here)

- [ ] **Step 1: Install shadcn**
```bash
npx shadcn@latest init
```
Answer the prompts:
- Style: **New York**
- Base color: **Neutral**
- CSS variables for colors: **Yes**

This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 2: Install the components we'll need across all phases**
```bash
npx shadcn@latest add button badge checkbox textarea select separator tabs dialog tooltip
```

- [ ] **Step 3: Verify a shadcn component renders**

Update `src/App.tsx`:
```tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function App() {
  return (
    <div className="bg-bg min-h-screen p-8 flex flex-col gap-4">
      <p className="text-text font-sans text-lg font-semibold">Intella Dashboard</p>
      <div className="flex gap-2">
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Badge>Badge</Badge>
      </div>
    </div>
  )
}
```

Run `npm run dev`. Expected: buttons and badge render cleanly. Kill the server.

- [ ] **Step 4: Add path alias to tsconfig and vite config**

`tsconfig.app.json` — add to `compilerOptions`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Install path types: `npm install --save-dev @types/node`

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "chore: add shadcn/ui with path alias"
```

---

### Task 4: Configure ESLint + Prettier

**Files:**
- Create: `eslint.config.ts`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `package.json` (add lint script)

- [ ] **Step 1: Install ESLint and Prettier packages**
```bash
npm install --save-dev prettier eslint-config-prettier @eslint/js globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

- [ ] **Step 2: Write ESLint flat config**

Replace `eslint.config.js` (if it exists from Vite scaffold) or create `eslint.config.ts`:
```ts
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
)
```

- [ ] **Step 3: Write Prettier config**

Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSameLine": false
}
```

Create `.prettierignore`:
```
dist
node_modules
.husky
```

- [ ] **Step 4: Add lint and format scripts to package.json**

Add to the `"scripts"` block in `package.json`:
```json
"lint": "eslint . --max-warnings 0",
"lint:fix": "eslint . --fix",
"format": "prettier --write ."
```

- [ ] **Step 5: Verify lint passes**
```bash
npm run lint
```
Expected: No errors. If Vite scaffold left `src/App.css` import somewhere, clean it up.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "chore: configure eslint and prettier"
```

---

### Task 5: Set Up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/tokens.test.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install Vitest and testing libraries**
```bash
npm install --save-dev vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Write a smoke test to verify the setup works**

Create `src/test/tokens.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

// Smoke test: verifies Vitest + jsdom + jest-dom are wired up correctly.
// Actual logic tests are added in later phases.
describe('test infrastructure', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('has access to DOM globals', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    expect(el.textContent).toBe('hello')
  })
})
```

- [ ] **Step 6: Run tests to confirm they pass**
```bash
npm run test:run
```
Expected:
```
✓ src/test/tokens.test.ts (2 tests)
Test Files  1 passed
Tests       2 passed
```

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "chore: add vitest with jsdom and testing library"
```

---

### Task 6: Set Up Husky + lint-staged + commitlint

**Files:**
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Create: `.husky/pre-push`
- Create: `commitlint.config.cjs`
- Modify: `package.json`

- [ ] **Step 1: Install Husky, lint-staged, and commitlint**
```bash
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
```

- [ ] **Step 2: Initialize Husky**
```bash
npx husky init
```
Expected: Creates `.husky/` directory with a default `pre-commit` file and adds `"prepare": "husky"` to `package.json`.

- [ ] **Step 3: Configure pre-commit hook (lint-staged)**

Replace `.husky/pre-commit` with:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

- [ ] **Step 4: Configure commit-msg hook (commitlint)**

Create `.husky/commit-msg`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

Make it executable:
```bash
chmod +x .husky/commit-msg
```

- [ ] **Step 5: Configure pre-push hook (tests)**

Replace `.husky/pre-push` (or create it):
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npm run test:run
```

Make it executable:
```bash
chmod +x .husky/pre-push
```

- [ ] **Step 6: Create commitlint config**

Create `commitlint.config.cjs`:
```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test', 'build', 'ci'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 100],
  },
}
```

- [ ] **Step 7: Configure lint-staged in package.json**

Add to `package.json` (top level, alongside `"scripts"`):
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,json,md}": ["prettier --write"]
}
```

- [ ] **Step 8: Verify hooks fire on commit**

Stage a file and attempt a bad commit message:
```bash
git add commitlint.config.cjs
git commit -m "bad commit message"
```
Expected: commitlint rejects it with `subject-case` or type error.

Now commit with a valid message:
```bash
git commit -m "chore: add husky lint-staged and commitlint"
```
Expected: lint-staged runs ESLint + Prettier on staged files, then commit succeeds.

---

### Task 7: Configure Netlify + README

**Files:**
- Create: `netlify.toml`
- Create: `netlify/functions/.gitkeep`
- Create: `.env.example`
- Create: `.gitignore` additions
- Create: `README.md`

- [ ] **Step 1: Create netlify.toml**

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Create functions directory placeholder**
```bash
mkdir -p netlify/functions
touch netlify/functions/.gitkeep
```

- [ ] **Step 3: Create .env.example**

Create `.env.example`:
```
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Set in Netlify dashboard for the Claude proxy function (Phase 8)
# ANTHROPIC_API_KEY is NOT needed here if using user-entered keys (current mode)
```

- [ ] **Step 4: Ensure .env.local is gitignored**

Verify `.gitignore` contains (add if missing):
```
.env.local
.env*.local
dist
node_modules
```

- [ ] **Step 5: Write README.md**

Create `README.md`:
```markdown
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
- A Supabase project (see [supabase.com](https://supabase.com))

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd intella-hiring-dashboard
   npm install
   ```

2. Copy the environment template and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations and seed data (see `supabase/README.md`).

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |

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

| Phase | Description | Status |
|---|---|---|
| 1 | Project Foundation | ✅ Done |
| 2 | Auth & Data Layer | ⬜ Pending |
| 3 | App Shell & Routing | ⬜ Pending |
| 4 | Cards Tab | ⬜ Pending |
| 5 | Profile Modal | ⬜ Pending |
| 6 | Secondary Tabs | ⬜ Pending |
| 7 | Day Briefing & Analysis | ⬜ Pending |
| 8 | AI Assistant & Exports | ⬜ Pending |
```

- [ ] **Step 6: Final build verification**
```bash
npm run build
```
Expected: Vite outputs to `dist/` with no errors or warnings.

- [ ] **Step 7: Commit everything**
```bash
git add -A
git commit -m "chore: add netlify config and readme"
```

---

**Phase 1 complete.** The project skeleton is in place. Proceed to Phase 2: Auth & Data Layer.
