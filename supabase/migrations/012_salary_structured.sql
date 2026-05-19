-- supabase/migrations/012_salary_structured.sql
ALTER TABLE candidates
  ADD COLUMN salary_amount  integer,
  ADD COLUMN salary_currency text,
  ADD COLUMN salary_period  text;

ALTER TABLE candidates
  DROP COLUMN salary;
