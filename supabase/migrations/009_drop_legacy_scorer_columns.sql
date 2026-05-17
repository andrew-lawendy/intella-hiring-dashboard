-- Drop hardcoded scorer columns from interview_state
ALTER TABLE interview_state
  DROP COLUMN IF EXISTS peter_scores,
  DROP COLUMN IF EXISTS ossama_scores,
  DROP COLUMN IF EXISTS peter_comment,
  DROP COLUMN IF EXISTS ossama_comment;

-- Drop scorer_slot from profiles (was a bridge to the old columns)
ALTER TABLE profiles DROP COLUMN IF EXISTS scorer_slot;

-- Allow all intellaworld users to read all profiles (needed for co-scorer name display)
DROP POLICY IF EXISTS "profiles: select own" ON profiles;
CREATE POLICY "profiles: select"
  ON profiles FOR SELECT
  USING (is_intellaworld_user());
