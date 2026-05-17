ALTER TABLE hiring_rounds
  ADD COLUMN IF NOT EXISTS score_categories text[] NOT NULL DEFAULT ARRAY['Communication','Technical','Culture Fit','Leadership','Overall'];

UPDATE hiring_rounds SET score_categories = ARRAY['Communication','Technical','Culture Fit','Leadership','Overall'] WHERE is_active = true;
