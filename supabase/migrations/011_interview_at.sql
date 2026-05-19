-- supabase/migrations/011_interview_at.sql
ALTER TABLE candidates
  ADD COLUMN interview_at timestamptz;

ALTER TABLE candidates
  DROP COLUMN slot,
  DROP COLUMN day,
  DROP COLUMN time;
