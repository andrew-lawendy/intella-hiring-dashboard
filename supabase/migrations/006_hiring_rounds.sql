CREATE TABLE IF NOT EXISTS hiring_rounds (
  id           serial PRIMARY KEY,
  name         text NOT NULL,
  role         text NOT NULL,
  role_short   text NOT NULL,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  is_active    boolean NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- Enforce at most one active round
CREATE UNIQUE INDEX hiring_rounds_one_active
  ON hiring_rounds (is_active)
  WHERE is_active = true;

ALTER TABLE hiring_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hiring_rounds: select"
  ON hiring_rounds FOR SELECT
  USING (is_intellaworld_user());

INSERT INTO hiring_rounds (name, role, role_short, start_date, end_date, is_active)
VALUES ('May 2026 Hiring Round', 'Senior Product Manager', 'Senior PM', '2026-05-17', '2026-05-21', true);
