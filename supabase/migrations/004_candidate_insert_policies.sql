CREATE POLICY "intellaworld: insert candidates"
  ON candidates FOR INSERT
  WITH CHECK (is_intellaworld_user());

CREATE POLICY "intellaworld: insert profiles"
  ON candidate_profiles FOR INSERT
  WITH CHECK (is_intellaworld_user());

CREATE POLICY "intellaworld: insert analysis"
  ON candidate_analysis FOR INSERT
  WITH CHECK (is_intellaworld_user());
