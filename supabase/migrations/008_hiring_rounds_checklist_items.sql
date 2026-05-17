ALTER TABLE hiring_rounds
  ADD COLUMN IF NOT EXISTS checklist_items text[] NOT NULL DEFAULT ARRAY['CV reviewed','LinkedIn checked','Questions prepared','Salary discussed','Notice period confirmed'];

UPDATE hiring_rounds SET checklist_items = ARRAY['CV reviewed','LinkedIn checked','Questions prepared','Salary discussed','Notice period confirmed'] WHERE is_active = true;
