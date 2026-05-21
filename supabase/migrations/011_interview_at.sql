-- supabase/migrations/011_interview_at.sql
ALTER TABLE candidates
  ADD COLUMN interview_at timestamptz;

-- Migrate: strip weekday name from `day`, combine with start of `time` range, parse as 2026
UPDATE candidates
SET interview_at = to_timestamp(
  regexp_replace(day, '^[A-Za-z]+ ', '') || ' 2026 ' || split_part(time, ' - ', 1),
  'DD Month YYYY HH24:MI'
)
WHERE day IS NOT NULL AND day <> 'TBD' AND time IS NOT NULL AND time <> 'TBD';

ALTER TABLE candidates
  DROP COLUMN slot,
  DROP COLUMN day,
  DROP COLUMN time;
