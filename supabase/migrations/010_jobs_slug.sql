ALTER TABLE jobs ADD COLUMN slug text;

UPDATE jobs SET slug = CASE id
  WHEN 2  THEN 'product-manager'
  WHEN 3  THEN 'ml-nlp-engineer'
  WHEN 4  THEN 'backend-engineer'
  WHEN 5  THEN 'frontend-engineer'
  WHEN 7  THEN 'devops-infrastructure'
  WHEN 9  THEN 'qa-engineer'
  WHEN 10 THEN 'enterprise-sales'
  WHEN 11 THEN 'business-development'
  WHEN 12 THEN 'customer-success'
END;

ALTER TABLE jobs ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX jobs_slug_unique ON jobs (slug);
