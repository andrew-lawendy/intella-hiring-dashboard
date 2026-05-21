-- supabase/migrations/012_salary_structured.sql
ALTER TABLE candidates
  ADD COLUMN salary_amount  integer,
  ADD COLUMN salary_currency text,
  ADD COLUMN salary_period  text;

-- Migrate free-text salary into structured fields.
-- Currency: $ or USD → USD, EGP → EGP.
-- Period: all entries are monthly.
-- Amount: first number in the string; K suffix × 1000; ranges take lower bound; TBD → null.
UPDATE candidates SET
  salary_currency = CASE
    WHEN salary LIKE '%$%' OR salary LIKE '%USD%' THEN 'USD'
    WHEN salary LIKE '%EGP%' THEN 'EGP'
    ELSE NULL
  END,
  salary_period = CASE
    WHEN salary IS NOT NULL AND salary <> 'TBD' THEN 'month'
    ELSE NULL
  END,
  salary_amount = CASE
    WHEN salary IS NULL OR salary = 'TBD' THEN NULL
    WHEN salary ~ '\d+[Kk]' THEN
      (regexp_replace((regexp_match(salary, '(\d+)[Kk]'))[1], ',', '', 'g'))::integer * 1000
    ELSE
      (regexp_replace((regexp_match(salary, '(\d[\d,]*)'))[1], ',', '', 'g'))::integer
  END
WHERE salary IS NOT NULL;

ALTER TABLE candidates
  DROP COLUMN salary;
