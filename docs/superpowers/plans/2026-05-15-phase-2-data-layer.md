# Phase 2: Auth & Data Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Supabase (schema, RLS, audit trigger), Google OAuth restricted to `@intellaworld.com`, extract the 20 embedded CVs from the HTML file into Supabase Storage, and seed all static data — so the app has a fully populated, auth-protected backend before any UI is built.

**Architecture:** Supabase is the single data source. The React app talks to it via a typed client (`@supabase/supabase-js`). All DB mutations go through the client; the trigger on `interview_state` auto-logs changes to `audit_log`. Auth is handled entirely by Supabase Auth with a Google OAuth provider. Domain restriction (`@intellaworld.com`) is enforced at the Supabase callback level in the React app.

**Tech Stack:** Supabase CLI, `@supabase/supabase-js`, TypeScript, Node.js (seed script), `tsx` (run TypeScript scripts directly)

**Prerequisites:** Phase 1 complete. A Supabase project created at [supabase.com](https://supabase.com) with the project URL and anon key available.

---

### Task 1: Install Supabase Client + Create Types

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/database.types.ts`
- Create: `.env.local` (gitignored)

- [ ] **Step 1: Install Supabase client**
```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create .env.local with your project credentials**

Create `.env.local` (never commit this file):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Get these from: Supabase Dashboard → Project Settings → API.

- [ ] **Step 3: Write TypeScript database types**

Create `src/lib/database.types.ts`:
```ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          name: string
          email: string
          slot: string | null
          day: string | null
          time: string | null
          type: 'In-person' | 'Remote' | null
          salary: string | null
          notice: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['candidates']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>
      }
      candidate_profiles: {
        Row: {
          candidate_id: string
          title: string | null
          company: string | null
          summary: string | null
          strengths: string[] | null
          weaknesses: string[] | null
          fit_score: number | null
          fit_label: string | null
          fit_color: string | null
          ai_score: number | null
          fintech_score: number | null
          b2b_score: number | null
          seniority_score: number | null
          custom_questions: string[] | null
          watch_for: string | null
          career: Json
        }
        Insert: Database['public']['Tables']['candidate_profiles']['Row']
        Update: Partial<Database['public']['Tables']['candidate_profiles']['Insert']>
      }
      candidate_analysis: {
        Row: {
          candidate_id: string
          university: string | null
          degree: string | null
          grad_year: number | null
          masters: string | null
          total_exp: number | null
          pm_exp: number | null
          current_role: string | null
          current_company: string | null
          domains: string[] | null
          ai_exp: boolean
          b2b: boolean
          b2c: boolean
          fintech: boolean
          notable: string | null
        }
        Insert: Database['public']['Tables']['candidate_analysis']['Row']
        Update: Partial<Database['public']['Tables']['candidate_analysis']['Insert']>
      }
      interview_state: {
        Row: {
          candidate_id: string
          confirmed: boolean
          shortlisted: boolean | null
          interview_status: 'pending' | 'in-progress' | 'completed'
          verdict: 'strong-yes' | 'yes' | 'maybe' | 'no' | null
          peter_scores: Json
          ossama_scores: Json
          peter_comment: string
          ossama_comment: string
          checklist: Json
          photo_url: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['interview_state']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['interview_state']['Insert']>
      }
      interview_questions: {
        Row: {
          id: number
          position: number
          title: string
          duration: string | null
          goal: string | null
          color: string | null
          bg: string | null
          questions: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['interview_questions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['interview_questions']['Insert']>
      }
      audit_log: {
        Row: {
          id: number
          candidate_id: string | null
          changed_by: string
          field: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
```

- [ ] **Step 4: Create the Supabase client singleton**

Create `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 5: Write a test for the client module**

Create `src/lib/__tests__/supabase.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the env variables before the module loads
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

describe('supabase client', () => {
  it('exports a supabase client', async () => {
    const { supabase } = await import('../supabase')
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })
})
```

- [ ] **Step 6: Run the test**
```bash
npm run test:run src/lib/__tests__/supabase.test.ts
```
Expected: 1 test passes.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(data): add supabase client and database types"
```

---

### Task 2: Run Database Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `supabase/migrations/003_audit_log_trigger.sql`
- Create: `supabase/README.md`

- [ ] **Step 1: Create the migrations directory**
```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write the initial schema migration**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- candidates
CREATE TABLE IF NOT EXISTS candidates (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  email        text NOT NULL,
  slot         text,
  day          text,
  time         text,
  type         text CHECK (type IN ('In-person', 'Remote')),
  salary       text,
  notice       text,
  created_at   timestamptz DEFAULT now()
);

-- candidate_profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
  candidate_id     text PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  title            text,
  company          text,
  summary          text,
  strengths        text[],
  weaknesses       text[],
  fit_score        integer CHECK (fit_score BETWEEN 0 AND 100),
  fit_label        text,
  fit_color        text,
  ai_score         integer CHECK (ai_score BETWEEN 0 AND 5),
  fintech_score    integer CHECK (fintech_score BETWEEN 0 AND 5),
  b2b_score        integer CHECK (b2b_score BETWEEN 0 AND 5),
  seniority_score  integer CHECK (seniority_score BETWEEN 0 AND 5),
  custom_questions text[],
  watch_for        text,
  career           jsonb DEFAULT '[]'
);

-- candidate_analysis
CREATE TABLE IF NOT EXISTS candidate_analysis (
  candidate_id    text PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  university      text,
  degree          text,
  grad_year       integer,
  masters         text,
  total_exp       integer,
  pm_exp          integer,
  current_role    text,
  current_company text,
  domains         text[],
  ai_exp          boolean DEFAULT false,
  b2b             boolean DEFAULT false,
  b2c             boolean DEFAULT false,
  fintech         boolean DEFAULT false,
  notable         text
);

-- interview_state
CREATE TABLE IF NOT EXISTS interview_state (
  candidate_id      text PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  confirmed         boolean DEFAULT false,
  shortlisted       boolean,
  interview_status  text DEFAULT 'pending'
    CHECK (interview_status IN ('pending', 'in-progress', 'completed')),
  verdict           text
    CHECK (verdict IN ('strong-yes', 'yes', 'maybe', 'no')),
  peter_scores      jsonb DEFAULT '{"Communication":0,"Technical":0,"Culture Fit":0,"Leadership":0,"Overall":0}',
  ossama_scores     jsonb DEFAULT '{"Communication":0,"Technical":0,"Culture Fit":0,"Leadership":0,"Overall":0}',
  peter_comment     text DEFAULT '',
  ossama_comment    text DEFAULT '',
  checklist         jsonb DEFAULT '{"CV reviewed":false,"LinkedIn checked":false,"Questions prepared":false,"Salary discussed":false,"Notice period confirmed":false}',
  photo_url         text,
  updated_at        timestamptz DEFAULT now()
);

-- interview_questions
CREATE TABLE IF NOT EXISTS interview_questions (
  id        serial PRIMARY KEY,
  position  integer NOT NULL,
  title     text NOT NULL,
  duration  text,
  goal      text,
  color     text,
  bg        text,
  questions text[]
);

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id           bigserial PRIMARY KEY,
  candidate_id text REFERENCES candidates(id),
  changed_by   text NOT NULL,
  field        text NOT NULL,
  old_value    text,
  new_value    text,
  created_at   timestamptz DEFAULT now()
);
```

- [ ] **Step 3: Write the RLS policies migration**

Create `supabase/migrations/002_rls_policies.sql`:
```sql
-- Enable RLS on all tables
ALTER TABLE candidates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_analysis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_state     ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if the authenticated user has an @intellaworld.com email
CREATE OR REPLACE FUNCTION is_intellaworld_user()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email LIKE '%@intellaworld.com'
  );
$$;

-- candidates: read-only for intellaworld users
CREATE POLICY "intellaworld: select candidates"
  ON candidates FOR SELECT USING (is_intellaworld_user());

-- candidate_profiles: read-only
CREATE POLICY "intellaworld: select profiles"
  ON candidate_profiles FOR SELECT USING (is_intellaworld_user());

-- candidate_analysis: read-only
CREATE POLICY "intellaworld: select analysis"
  ON candidate_analysis FOR SELECT USING (is_intellaworld_user());

-- interview_state: read + write
CREATE POLICY "intellaworld: select state"
  ON interview_state FOR SELECT USING (is_intellaworld_user());
CREATE POLICY "intellaworld: insert state"
  ON interview_state FOR INSERT WITH CHECK (is_intellaworld_user());
CREATE POLICY "intellaworld: update state"
  ON interview_state FOR UPDATE USING (is_intellaworld_user());

-- interview_questions: read-only
CREATE POLICY "intellaworld: select questions"
  ON interview_questions FOR SELECT USING (is_intellaworld_user());

-- audit_log: read + insert (no update/delete)
CREATE POLICY "intellaworld: select audit_log"
  ON audit_log FOR SELECT USING (is_intellaworld_user());
CREATE POLICY "intellaworld: insert audit_log"
  ON audit_log FOR INSERT WITH CHECK (is_intellaworld_user());
```

- [ ] **Step 4: Write the audit log trigger migration**

Create `supabase/migrations/003_audit_log_trigger.sql`:
```sql
-- Trigger function: logs changes to interview_state into audit_log
CREATE OR REPLACE FUNCTION log_interview_state_changes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  IF OLD.verdict IS DISTINCT FROM NEW.verdict THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'verdict', OLD.verdict, NEW.verdict);
  END IF;

  IF OLD.shortlisted IS DISTINCT FROM NEW.shortlisted THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'shortlisted',
            OLD.shortlisted::text, NEW.shortlisted::text);
  END IF;

  IF OLD.interview_status IS DISTINCT FROM NEW.interview_status THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'interview_status',
            OLD.interview_status, NEW.interview_status);
  END IF;

  IF OLD.confirmed IS DISTINCT FROM NEW.confirmed THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'confirmed',
            OLD.confirmed::text, NEW.confirmed::text);
  END IF;

  IF OLD.peter_scores IS DISTINCT FROM NEW.peter_scores THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'peter_scores',
            OLD.peter_scores::text, NEW.peter_scores::text);
  END IF;

  IF OLD.ossama_scores IS DISTINCT FROM NEW.ossama_scores THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'ossama_scores',
            OLD.ossama_scores::text, NEW.ossama_scores::text);
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER interview_state_audit
  BEFORE UPDATE ON interview_state
  FOR EACH ROW EXECUTE FUNCTION log_interview_state_changes();
```

- [ ] **Step 5: Run migrations in Supabase**

Go to Supabase Dashboard → SQL Editor and run each migration file in order:
1. Run `001_initial_schema.sql`
2. Run `002_rls_policies.sql`
3. Run `003_audit_log_trigger.sql`

Expected after each: "Success. No rows returned."

- [ ] **Step 6: Write supabase README**

Create `supabase/README.md`:
```markdown
# Supabase Setup

## Running Migrations

Run each file in `migrations/` in order via the Supabase Dashboard → SQL Editor:

1. `001_initial_schema.sql` — creates all tables
2. `002_rls_policies.sql` — enables RLS and sets access policies
3. `003_audit_log_trigger.sql` — installs the audit log trigger

## Seeding Data

After running migrations, seed static data:
```bash
npm run seed
```

Then upload CVs:
```bash
npm run seed:cvs
```

## Migrating to Self-Hosted Postgres

When ready to move off Supabase:
1. `pg_dump` from Supabase
2. Restore to your Postgres container
3. Update `VITE_SUPABASE_URL` to your new DB endpoint
```

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(data): add supabase migrations and rls policies"
```

---

### Task 3: Write the Seed Script

**Files:**
- Create: `supabase/seed/data/candidates.ts`
- Create: `supabase/seed/data/profiles.ts`
- Create: `supabase/seed/data/analysis.ts`
- Create: `supabase/seed/data/state.ts`
- Create: `supabase/seed/data/questions.ts`
- Create: `supabase/seed/index.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Install tsx for running TypeScript scripts**
```bash
npm install --save-dev tsx dotenv
```

- [ ] **Step 2: Create candidates seed data**

Create `supabase/seed/data/candidates.ts`:
```ts
export const candidatesData = [
  { id: 'mina', name: 'Mina Taallap Shawkei', email: 'minataallap@gmail.com', slot: 'Sun 17 May 11:00-12:00', day: 'Sunday 17 May', time: '11:00 - 12:00', type: 'In-person' as const, salary: '85K-100K EGP', notice: '30 days' },
  { id: 'lamia', name: 'Lamia Mostafa', email: 'lamiamostafa2@gmail.com', slot: 'Sun 17 May 12:00-13:00', day: 'Sunday 17 May', time: '12:00 - 13:00', type: 'In-person' as const, salary: '60,000 EGP', notice: '30 days' },
  { id: 'malak', name: 'Malak Abdelghaffar', email: 'malak.yabdelghaffar@gmail.com', slot: 'Sun 17 May 13:00-14:00', day: 'Sunday 17 May', time: '13:00 - 14:00', type: 'In-person' as const, salary: '~$3,000/month', notice: 'End of June' },
  { id: 'marwan', name: 'Marwan Elwan', email: '40marwan@gmail.com', slot: 'Sun 17 May 16:00-17:00', day: 'Sunday 17 May', time: '16:00 - 17:00', type: 'Remote' as const, salary: '$3,000-$3,200/month', notice: '30 days' },
  { id: 'kareem', name: 'Kareem Ragab', email: 'Kareem.khaled@hotmail.com', slot: 'Mon 18 May 11:00-12:00', day: 'Monday 18 May', time: '11:00 - 12:00', type: 'In-person' as const, salary: '125K-150K EGP', notice: 'Immediate' },
  { id: 'mohamedeltabakh', name: 'Mohamed Adel Eltabakh', email: 'M.eltabakh@outlook.com', slot: 'Mon 18 May 16:00-17:00', day: 'Monday 18 May', time: '16:00 - 17:00', type: 'In-person' as const, salary: '85K-100K EGP', notice: 'Immediate' },
  { id: 'moaaz', name: 'Moaaz Tarek', email: 'moaaztarek4@gmail.com', slot: 'Mon 18 May 17:00-18:00', day: 'Monday 18 May', time: '17:00 - 18:00', type: 'In-person' as const, salary: '~85,000 EGP', notice: 'Immediate' },
  { id: 'hadeer', name: 'Hadeer Mohamed Saeed', email: 'Hadeer_m7md@hotmail.com', slot: 'Tue 19 May 12:00-13:00', day: 'Tuesday 19 May', time: '12:00 - 13:00', type: 'In-person' as const, salary: '90K-110K EGP', notice: '1 month' },
  { id: 'eman', name: 'Eman Wed Abdullah', email: 'emanwed@gmail.com', slot: 'Tue 19 May 15:00-16:00', day: 'Tuesday 19 May', time: '15:00 - 16:00', type: 'In-person' as const, salary: '$3,200/month', notice: '2 weeks' },
  { id: 'aliaa', name: 'Aliaa Magdy Elfeky', email: 'aliaaelfeki@gmail.com', slot: 'Tue 19 May 16:00-17:00', day: 'Tuesday 19 May', time: '16:00 - 17:00', type: 'In-person' as const, salary: 'TBD', notice: 'TBD' },
  { id: 'loay', name: 'Loay Hamdy Omar', email: 'loayhamdy96@gmail.com', slot: 'Tue 19 May 17:00-18:00', day: 'Tuesday 19 May', time: '17:00 - 18:00', type: 'In-person' as const, salary: '85K-90K EGP', notice: '3-4 weeks' },
  { id: 'zainab', name: 'Zainab Gehad Talaat', email: 'zainabgehad@gmail.com', slot: 'Tue 19 May 18:00-19:00', day: 'Tuesday 19 May', time: '18:00 - 19:00', type: 'In-person' as const, salary: '$1,850-$2,000/month', notice: '1 month' },
  { id: 'amr', name: 'Amr Mekawy', email: 'amekawy@aucegypt.edu', slot: 'Wed 20 May 11:00-12:00', day: 'Wednesday 20 May', time: '11:00 - 12:00', type: 'In-person' as const, salary: '150,000 EGP', notice: '1 month max' },
  { id: 'abdulrahman', name: 'Abdulrahman Nasser', email: 'abdelrahmannasserr@gmail.com', slot: 'Wed 20 May 12:00-13:00', day: 'Wednesday 20 May', time: '12:00 - 13:00', type: 'In-person' as const, salary: 'TBD', notice: 'Immediate' },
  { id: 'mostafaeltoukhy', name: 'Mostafa El Toukhy', email: 'Toukhy.mostafa@gmail.com', slot: 'Wed 20 May 16:00-17:00', day: 'Wednesday 20 May', time: '16:00 - 17:00', type: 'In-person' as const, salary: 'TBD', notice: '2 months' },
  { id: 'bavly', name: 'Bavly Ossam', email: 'bavlyossam@gmail.com', slot: 'Wed 20 May 17:00-18:00', day: 'Wednesday 20 May', time: '17:00 - 18:00', type: 'In-person' as const, salary: '70,000 EGP', notice: 'TBD' },
  { id: 'nada', name: 'Nada Ahmed Abdel Kader', email: 'nadaahmeda8@gmail.com', slot: 'Thu 21 May 14:00-15:00', day: 'Thursday 21 May', time: '14:00 - 15:00', type: 'In-person' as const, salary: '115K-125K EGP', notice: '30 days' },
  { id: 'mostafamahmoud', name: 'Mostafa Mahmoud', email: 'Mostafa.atallah1998@gmail.com', slot: 'Thu 21 May 15:00-16:00', day: 'Thursday 21 May', time: '15:00 - 16:00', type: 'In-person' as const, salary: 'TBD', notice: '1 month' },
  { id: 'omar', name: 'Omar Maged Youssef', email: 'omarxyoussef@gmail.com', slot: 'Thu 21 May 16:00-17:00', day: 'Thursday 21 May', time: '16:00 - 17:00', type: 'In-person' as const, salary: '115,000 EGP', notice: '1 month' },
  { id: 'george', name: 'George Fekry', email: 'georgefekry07@gmail.com', slot: 'TBD', day: 'TBD', time: 'TBD', type: 'In-person' as const, salary: '94,000 EGP', notice: '45 days' },
]

// Initial confirmation status from the HTML's INIT_CONFIRMED
export const initialConfirmed: Record<string, boolean> = {
  mina: true, lamia: true, malak: true, marwan: true, kareem: true,
  mohamedeltabakh: true, moaaz: true, hadeer: true, eman: true,
  aliaa: false, loay: true, amr: true, abdulrahman: true,
  mostafaeltoukhy: true, nada: true, mostafamahmoud: true,
  omar: true, george: false, zainab: true, bavly: true,
}
```

- [ ] **Step 3: Create questions seed data**

Create `supabase/seed/data/questions.ts`:
```ts
export const questionsData = [
  {
    position: 1,
    title: '1. Opening and Background',
    duration: '5-10 min',
    goal: 'Warm up and get context on their trajectory.',
    color: 'var(--blue)',
    bg: 'var(--blue-bg)',
    questions: [
      'Walk me through your product journey. What drew you to PM and what has been your most impactful role so far?',
      'Tell me about a product you owned end-to-end. What was your role, what did you ship, and how did you measure success?',
      'Why Intella, and why now?',
    ],
  },
  {
    position: 2,
    title: '2. AI and Tech Fluency',
    duration: '10-15 min',
    goal: 'Assess genuine AI understanding, not just buzzword familiarity.',
    color: 'var(--purple)',
    bg: 'var(--purple-bg)',
    questions: [
      'Have you worked on AI-powered products before? Walk me through what you built, how the AI component worked, and what the main product challenges were.',
      'How do you approach building a product when the AI model output is probabilistic and sometimes wrong? How do you handle that with users?',
      'What is the difference between an LLM-powered feature and a rule-based feature from a product design perspective?',
      'How do you define and measure quality for an AI agent? What KPIs would you use?',
      'Describe a situation where you translated a complex technical constraint into a product decision. How did you navigate it with engineering?',
    ],
  },
  {
    position: 3,
    title: '3. Product Thinking and Strategy',
    duration: '10-15 min',
    goal: 'Assess structured thinking, prioritization, and vision.',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    questions: [
      'You are given a blank slate to build a new AI agent feature for a banking client. Walk me through how you would approach discovery to delivery.',
      'How do you prioritize when you have five strong feature ideas, limited engineering bandwidth, and a hard deadline?',
      'Tell me about a time you killed a feature or changed direction after committing to it. What happened?',
      'How do you balance short-term client requests against long-term product vision?',
    ],
  },
  {
    position: 4,
    title: '4. Stakeholder Management and Execution',
    duration: '10 min',
    goal: 'Assess communication, cross-functional skills, and delivery muscle.',
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    questions: [
      'Describe a situation where engineering and business had conflicting priorities. How did you resolve it?',
      'How do you manage a client who keeps changing requirements mid-sprint?',
      'Walk me through how you run a sprint. What does your typical week look like as a PM?',
      'Tell me about a launch that did not go as planned. What went wrong?',
    ],
  },
  {
    position: 5,
    title: '5. Data and Growth',
    duration: '5-10 min',
    goal: 'Assess analytical thinking and data-driven decision making.',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    questions: [
      'How do you use data to make product decisions? Give me an example where data changed your direction.',
      'What metrics would you track for an AI agent deployed in a call center? How would you know it is working?',
      'Have you run A/B tests or experiments? Walk me through how you designed and interpreted one.',
    ],
  },
  {
    position: 6,
    title: '6. Culture and Self-awareness',
    duration: '5 min',
    goal: 'Assess fit, humility, and growth mindset.',
    color: 'var(--red)',
    bg: 'var(--red-bg)',
    questions: [
      'What is the most important thing you have learned about product management in the last 12 months?',
      'What kind of environment do you do your best work in?',
      'What is something you are still not great at as a PM, and what are you doing about it?',
    ],
  },
  {
    position: 7,
    title: '7. Candidate Questions',
    duration: '5 min',
    goal: 'The questions they ask reveal as much as their answers.',
    color: 'var(--text2)',
    bg: 'var(--surface2)',
    questions: ['Open floor. Invite the candidate to ask their questions.'],
  },
]
```

- [ ] **Step 4: Create the analysis seed data file**

Create `supabase/seed/data/analysis.ts` — copy the `ANALYSIS_DATA` array verbatim from the HTML file (`Intella Dashboard.html`, line ~2326), converting it to a TypeScript export:
```ts
export const analysisData = [
  { id: 'eman', name: 'Eman Wed Abdullah', slot: 'Tue 19 May 15:00', university: 'Ain Shams University', degree: 'B.Sc. Pharmaceutical Science', gradYear: 2013, masters: 'MBA – IE Business School (2022)', totalExp: 12, pmExp: 11, currentRole: 'Head of Products', currentCompany: 'MacQueen Corporate', domains: ['SaaS','Q-Commerce','HR Tech','Healthcare','Travel'], aiExp: true, b2b: true, b2c: true, fintech: false, notable: 'Most experienced — 11 yrs PM. Vezeeta, WUZZUF, Nana, MacQueen. MBA IE Business School.' },
  // ... copy all 20 entries from ANALYSIS_DATA in the HTML file
]
```

**Important:** Open `Intella Dashboard.html` and copy every entry from `const ANALYSIS_DATA = [` (line 2326) to its closing `];`. Convert property names from camelCase to match: `gradYear`, `totalExp`, `pmExp`, `currentRole`, `currentCompany`, `aiExp`. These already match. Keep all values exactly as they are in the HTML.

- [ ] **Step 5: Create the profiles seed data file**

Create `supabase/seed/data/profiles.ts` — extract from `const PROFILES = {` in the HTML (line 1624). Each key becomes an entry in an array:
```ts
export const profilesData = [
  {
    candidate_id: 'mina',
    title: 'Senior Product Manager',
    company: 'Fawry',
    summary: 'A sharp fintech PM who grew up inside Egypt\'s largest payments platform...',
    strengths: [
      'Launched Yellow Card for Retailers — captured 6% of total transaction throughput in 4 months',
      // ... all strengths from HTML
    ],
    weaknesses: [
      'Only 3 years of PM experience — junior for a Senior PM title at Intella',
      // ... all weaknesses from HTML
    ],
    fit_score: 62,
    fit_label: 'Moderate fit',
    fit_color: 'var(--amber)',
    ai_score: 1,
    fintech_score: 5,
    b2b_score: 2,
    seniority_score: 3,
    custom_questions: [
      // ... all custom questions from HTML
    ],
    watch_for: 'Strong execution instincts but limited AI exposure...',
    career: [
      { year: '2022–Now', role: 'Senior Product Manager', company: 'Fawry', desc: '...' },
      // ... all career entries
    ],
  },
  // ... one entry per candidate, all 20
]
```

**Important:** Copy verbatim from the `PROFILES` object in the HTML. Every candidate that has a PROFILES entry must have a matching `profiles.ts` entry. The `candidate_id` field is the same as the candidate's `id` slug.

- [ ] **Step 6: Write the main seed script**

Create `supabase/seed/index.ts`:
```ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/database.types'
import { candidatesData, initialConfirmed } from './data/candidates'
import { profilesData } from './data/profiles'
import { analysisData } from './data/analysis'
import { questionsData } from './data/questions'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// Use service role key to bypass RLS during seeding
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Seeding candidates...')
  const { error: candidateError } = await supabase
    .from('candidates')
    .upsert(candidatesData, { onConflict: 'id' })
  if (candidateError) throw candidateError

  console.log('Seeding candidate profiles...')
  const { error: profileError } = await supabase
    .from('candidate_profiles')
    .upsert(profilesData, { onConflict: 'candidate_id' })
  if (profileError) throw profileError

  console.log('Seeding candidate analysis...')
  const analysisRows = analysisData.map(({ id, name, slot, ...rest }) => ({
    candidate_id: id,
    ...rest,
  }))
  const { error: analysisError } = await supabase
    .from('candidate_analysis')
    .upsert(analysisRows, { onConflict: 'candidate_id' })
  if (analysisError) throw analysisError

  console.log('Seeding interview state...')
  const stateRows = candidatesData.map((c) => ({
    candidate_id: c.id,
    confirmed: initialConfirmed[c.id] ?? false,
    shortlisted: null,
    interview_status: 'pending' as const,
    verdict: null,
    peter_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 },
    ossama_scores: { Communication: 0, Technical: 0, 'Culture Fit': 0, Leadership: 0, Overall: 0 },
    peter_comment: '',
    ossama_comment: '',
    checklist: {
      'CV reviewed': false,
      'LinkedIn checked': false,
      'Questions prepared': false,
      'Salary discussed': false,
      'Notice period confirmed': false,
    },
    photo_url: null,
  }))
  const { error: stateError } = await supabase
    .from('interview_state')
    .upsert(stateRows, { onConflict: 'candidate_id' })
  if (stateError) throw stateError

  console.log('Seeding interview questions...')
  const { error: questionsError } = await supabase
    .from('interview_questions')
    .upsert(questionsData.map((q, i) => ({ ...q, id: i + 1 })), { onConflict: 'id' })
  if (questionsError) throw questionsError

  console.log('Seed complete.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
```

- [ ] **Step 7: Add SUPABASE_SERVICE_ROLE_KEY to .env.local**

Add to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get it from: Supabase Dashboard → Project Settings → API → service_role (secret).

- [ ] **Step 8: Add seed script to package.json**

Add to `"scripts"`:
```json
"seed": "tsx supabase/seed/index.ts"
```

- [ ] **Step 9: Run the seed script**
```bash
npm run seed
```
Expected:
```
Seeding candidates...
Seeding candidate profiles...
Seeding candidate analysis...
Seeding interview state...
Seeding interview questions...
Seed complete.
```

Verify in Supabase Dashboard → Table Editor that all tables have rows.

- [ ] **Step 10: Commit**
```bash
git add -A
git commit -m "feat(data): add seed script with all static data"
```

---

### Task 4: Extract CVs and Upload to Supabase Storage

**Files:**
- Create: `supabase/seed/extract-cvs.ts`
- Modify: `package.json`

- [ ] **Step 1: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → New bucket:
- Name: `candidate-cvs`
- Public: **No** (private)
- Click "Create bucket"

- [ ] **Step 2: Write CV extraction script**

Create `supabase/seed/extract-cvs.ts`:
```ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Extract CV_DATA object from the HTML file using regex
function extractCvData(html: string): Record<string, { mime: string; filename: string; data: string }> {
  const match = html.match(/const CV_DATA = ({[\s\S]*?^});/m)
  if (!match) {
    // Try alternative: find the object between CV_DATA = { and the next const/function
    const startIdx = html.indexOf('const CV_DATA = {')
    if (startIdx === -1) throw new Error('CV_DATA not found in HTML file')
    // Find balanced closing brace
    let depth = 0
    let inString = false
    let stringChar = ''
    let i = startIdx + 'const CV_DATA = '.length
    const objStart = i
    for (; i < html.length; i++) {
      const ch = html[i]
      if (inString) {
        if (ch === '\\') { i++; continue }
        if (ch === stringChar) inString = false
      } else {
        if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue }
        if (ch === '{') depth++
        if (ch === '}') { depth--; if (depth === 0) break }
      }
    }
    const objStr = html.slice(objStart, i + 1)
    // eslint-disable-next-line no-eval
    return eval(`(${objStr})`)
  }
  // eslint-disable-next-line no-eval
  return eval(`(${match[1]})`)
}

async function uploadCvs() {
  const htmlPath = join(process.cwd(), 'Intella Dashboard.html')
  console.log(`Reading HTML file from ${htmlPath}...`)
  const html = readFileSync(htmlPath, 'utf-8')

  console.log('Extracting CV data...')
  const cvData = extractCvData(html)
  const candidateIds = Object.keys(cvData)
  console.log(`Found ${candidateIds.length} CVs: ${candidateIds.join(', ')}`)

  for (const id of candidateIds) {
    const cv = cvData[id]
    if (!cv || !cv.data) {
      console.log(`  Skipping ${id} — no data`)
      continue
    }

    console.log(`  Uploading ${id}.pdf (${cv.filename})...`)
    const buffer = Buffer.from(cv.data, 'base64')

    const { error } = await supabase.storage
      .from('candidate-cvs')
      .upload(`${id}.pdf`, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error(`  Failed to upload ${id}: ${error.message}`)
    } else {
      console.log(`  ✓ ${id}.pdf uploaded`)
    }
  }

  console.log('CV upload complete.')
}

uploadCvs().catch((err) => {
  console.error('CV extraction failed:', err)
  process.exit(1)
})
```

- [ ] **Step 3: Add CV seed script to package.json**

Add to `"scripts"`:
```json
"seed:cvs": "tsx supabase/seed/extract-cvs.ts"
```

- [ ] **Step 4: Run the CV extraction**
```bash
npm run seed:cvs
```
Expected:
```
Reading HTML file...
Extracting CV data...
Found 20 CVs: mina, lamia, malak, ...
  Uploading mina.pdf...
  ✓ mina.pdf uploaded
  ...
CV upload complete.
```

Verify in Supabase Dashboard → Storage → candidate-cvs: 20 PDF files present.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(data): add cv extraction and supabase storage upload script"
```

---

### Task 5: Set Up Google OAuth + Auth Components

**Files:**
- Create: `src/components/auth/LoginPage.tsx`
- Create: `src/components/auth/AuthGuard.tsx`
- Create: `src/components/auth/AuthCallback.tsx`
- Create: `src/hooks/useAuth.ts`
- Modify: `src/App.tsx` (add auth routes placeholder — full routing wired in Phase 3)

- [ ] **Step 1: Enable Google OAuth in Supabase**

In Supabase Dashboard → Authentication → Providers → Google:
- Enable Google provider
- Add your Google OAuth Client ID and Secret (from Google Cloud Console)
- Authorized redirect URI to add in Google Cloud Console: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Save

- [ ] **Step 2: Write the useAuth hook**

Create `src/hooks/useAuth.ts`:
```ts
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

  const signOut = () => supabase.auth.signOut()

  const isIntellaUser = user?.email?.endsWith('@intellaworld.com') ?? false

  return { session, user, loading, isIntellaUser, signInWithGoogle, signOut }
}
```

- [ ] **Step 3: Write the LoginPage**

Create `src/components/auth/LoginPage.tsx`:
```tsx
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

interface LoginPageProps {
  error?: string
}

export function LoginPage({ error }: LoginPageProps) {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[var(--radius)] p-8 shadow-[var(--shadow-md)]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-8 h-8 rounded-[7px] flex-shrink-0"
            style={{
              background: 'radial-gradient(120% 100% at 0% 0%, #4c44c4, #2a2479 70%)',
              boxShadow: '0 1px 0 rgba(255,255,255,.35) inset, 0 4px 12px -4px rgba(42,36,121,.5)',
            }}
          />
          <div>
            <p className="text-text font-sans font-semibold text-[17px] leading-none tracking-tight">
              Intella
            </p>
            <p className="text-text3 font-sans text-[13px] mt-0.5">Interview Dashboard</p>
          </div>
        </div>

        <h1 className="text-text font-sans font-semibold text-xl tracking-tight mb-1">
          Sign in
        </h1>
        <p className="text-text2 font-sans text-sm mb-6">
          Use your @intellaworld.com Google account.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-bg border border-red-line rounded-[var(--radius-xs)] text-red text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={signInWithGoogle}
          className="w-full bg-text text-bg hover:bg-text2 border-0 font-medium"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write the AuthCallback component**

Create `src/components/auth/AuthCallback.tsx`:
```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email ?? ''
      if (email.endsWith('@intellaworld.com')) {
        navigate('/', { replace: true })
      } else {
        // Sign out non-intellaworld accounts immediately
        supabase.auth.signOut().then(() => {
          navigate('/login?error=unauthorized', { replace: true })
        })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-text2 font-sans text-sm">Completing sign in...</p>
    </div>
  )
}
```

- [ ] **Step 5: Write the AuthGuard component**

Create `src/components/auth/AuthGuard.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from './LoginPage'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, session, isIntellaUser } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-surface3 border-t-text rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !isIntellaUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 6: Write tests for useAuth**

Create `src/hooks/__tests__/useAuth.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

describe('useAuth', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
  })

  it('isIntellaUser is false when no user', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isIntellaUser).toBe(false)
  })
})
```

- [ ] **Step 7: Run auth tests**
```bash
npm run test:run src/hooks/__tests__/useAuth.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "feat(auth): add google oauth login page, auth guard, and callback"
```

---

**Phase 2 complete.** Supabase is set up, all data is seeded, CVs are in Storage, and auth components are ready. Proceed to Phase 3: App Shell & Routing.
