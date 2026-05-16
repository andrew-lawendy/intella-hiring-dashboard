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
  "current_role"  text,
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
