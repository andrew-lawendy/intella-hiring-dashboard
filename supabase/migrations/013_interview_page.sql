-- 1. Drop dead table (zero app references)
DROP TABLE IF EXISTS hiring_rounds;

-- 2. Add notes to interview_state
ALTER TABLE interview_state
  ADD COLUMN notes jsonb NOT NULL DEFAULT '{}';

-- 3. Extend interview_questions with is_general + job_id
ALTER TABLE interview_questions
  ADD COLUMN is_general boolean NOT NULL DEFAULT false,
  ADD COLUMN job_id integer REFERENCES jobs(id);

-- Existing PM questions become job-specific (job id 2 = product-manager)
UPDATE interview_questions SET is_general = false, job_id = 2;

-- Insert 3 general sections (position 100+ so they sort after job-specific 1-7)
INSERT INTO interview_questions (position, title, duration, goal, color, bg, questions, is_general, job_id)
VALUES
  (100, 'Background & Motivation', '5-10 min', 'Understand the candidate''s trajectory and what drives them.',
   '#6366f1', '#eef2ff',
   ARRAY[
     'Walk me through your career so far. What has been your most meaningful role and why?',
     'What drew you to apply for this position at Intella?',
     'What does success look like for you in the first 6 months of a new role?'
   ], true, null),

  (101, 'Collaboration & Communication', '5-10 min', 'Assess how the candidate works with others and handles conflict.',
   '#0ea5e9', '#f0f9ff',
   ARRAY[
     'Describe a situation where you had to align people with different priorities. How did you handle it?',
     'Tell me about a time you gave or received feedback that changed how you worked.',
     'How do you prefer to communicate progress and blockers on a project?'
   ], true, null),

  (102, 'Reflection & Growth', '5 min', 'Assess self-awareness, learning mindset, and cultural fit.',
   '#10b981', '#f0fdf4',
   ARRAY[
     'What is something you are actively trying to improve about the way you work?',
     'Tell me about a failure or mistake you made. What did you learn?',
     'What kind of environment brings out your best work?'
   ], true, null);
