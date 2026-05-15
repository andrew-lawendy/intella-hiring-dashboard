ALTER TABLE candidates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_analysis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_state     ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_intellaworld_user()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email LIKE '%@intellaworld.com'
  );
$$;

CREATE POLICY "intellaworld: select candidates"
  ON candidates FOR SELECT USING (is_intellaworld_user());

CREATE POLICY "intellaworld: select profiles"
  ON candidate_profiles FOR SELECT USING (is_intellaworld_user());

CREATE POLICY "intellaworld: select analysis"
  ON candidate_analysis FOR SELECT USING (is_intellaworld_user());

CREATE POLICY "intellaworld: select state"
  ON interview_state FOR SELECT USING (is_intellaworld_user());
CREATE POLICY "intellaworld: insert state"
  ON interview_state FOR INSERT WITH CHECK (is_intellaworld_user());
CREATE POLICY "intellaworld: update state"
  ON interview_state FOR UPDATE USING (is_intellaworld_user());

CREATE POLICY "intellaworld: select questions"
  ON interview_questions FOR SELECT USING (is_intellaworld_user());

CREATE POLICY "intellaworld: select audit_log"
  ON audit_log FOR SELECT USING (is_intellaworld_user());
CREATE POLICY "intellaworld: insert audit_log"
  ON audit_log FOR INSERT WITH CHECK (is_intellaworld_user());
