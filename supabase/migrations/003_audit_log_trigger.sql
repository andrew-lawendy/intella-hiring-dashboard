CREATE OR REPLACE FUNCTION log_interview_state_changes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  IF OLD.verdict IS DISTINCT FROM NEW.verdict THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'verdict', OLD.verdict, NEW.verdict);
  END IF;

  IF OLD.shortlisted IS DISTINCT FROM NEW.shortlisted THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'shortlisted',
            OLD.shortlisted::text, NEW.shortlisted::text);
  END IF;

  IF OLD.interview_status IS DISTINCT FROM NEW.interview_status THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'interview_status',
            OLD.interview_status, NEW.interview_status);
  END IF;

  IF OLD.confirmed IS DISTINCT FROM NEW.confirmed THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'confirmed',
            OLD.confirmed::text, NEW.confirmed::text);
  END IF;

  IF OLD.peter_scores IS DISTINCT FROM NEW.peter_scores THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'peter_scores',
            OLD.peter_scores::text, NEW.peter_scores::text);
  END IF;

  IF OLD.ossama_scores IS DISTINCT FROM NEW.ossama_scores THEN
    INSERT INTO audit_log (candidate_id, changed_by, field, old_value, new_value)
    VALUES (NEW.candidate_id, COALESCE(v_user_email, 'system'), 'ossama_scores',
            OLD.ossama_scores::text, NEW.ossama_scores::text);
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER interview_state_audit
  BEFORE UPDATE ON interview_state
  FOR EACH ROW EXECUTE FUNCTION log_interview_state_changes();
