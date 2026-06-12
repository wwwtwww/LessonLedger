-- =====================================================================================
-- WARNING: DEV-ONLY CLEAN SLATE SCRIPT
-- Do NOT run this script in production. It drops all tables and destroys data.
-- Use standard Supabase migrations for production schema changes.
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- 2. Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create user_profiles table (Links auth.users to families)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('creator', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('adult', 'kid')),
  avatar VARCHAR(255),
  theme_color VARCHAR(20),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id, family_id) -- Tenant Consistency: Composite unique key
);

-- 5. Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_price DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (total_price >= 0),
  total_lessons DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (total_lessons >= 0),
  done_lessons DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (done_lessons >= 0),
  allow_overrun BOOLEAN DEFAULT FALSE NOT NULL,
  currency VARCHAR(10) DEFAULT '¥',
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('lesson', 'session')),
  duration INT DEFAULT 60,
  schedule JSONB DEFAULT '[]'::JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (member_id, family_id) REFERENCES members(id, family_id) ON DELETE CASCADE, -- Tenant Consistency
  UNIQUE (id, family_id), -- Tenant Consistency: Composite unique key
  CHECK (allow_overrun OR done_lessons <= total_lessons)
);

-- Protect derived fields in classes
CREATE OR REPLACE FUNCTION protect_class_derived_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Bypass protection if updated by our log projection trigger
  IF current_setting('app.is_log_trigger', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.done_lessons, 0) <> 0 OR
       COALESCE(NEW.total_lessons, 0) <> 0 OR
       COALESCE(NEW.total_price, 0) <> 0 THEN
      RAISE EXCEPTION 'Derived fields must start at zero. Use create_class_with_init to initialize balances.';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.done_lessons IS DISTINCT FROM OLD.done_lessons OR 
     NEW.total_lessons IS DISTINCT FROM OLD.total_lessons OR 
     NEW.total_price IS DISTINCT FROM OLD.total_price THEN
    RAISE EXCEPTION 'Derived fields (done_lessons, total_lessons, total_price) cannot be updated directly by clients. Use logs.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_class_derived_fields
BEFORE INSERT OR UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION protect_class_derived_fields();

-- 6. Create logs table (Event Sourced Ledger)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  client_event_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('check_in', 'skip', 'top_up', 'init', 'reversal')),
  done_lesson_delta DECIMAL(10,2) DEFAULT 0 NOT NULL,
  total_lesson_delta DECIMAL(10,2) DEFAULT 0 NOT NULL,
  price_delta DECIMAL(10,2) DEFAULT 0 NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reversed_log_id UUID REFERENCES logs(id), -- For reversals
  schedule_instance_key VARCHAR(255), -- For idempotency (class_id + date + time)
  note TEXT,
  FOREIGN KEY (class_id, family_id) REFERENCES classes(id, family_id) ON DELETE RESTRICT,
  UNIQUE (family_id, client_event_id),
  
  -- Delta Constraints
  CHECK (
    (type = 'skip' AND done_lesson_delta = 0 AND total_lesson_delta = 0 AND price_delta = 0) OR
    (type = 'check_in' AND done_lesson_delta > 0 AND total_lesson_delta = 0 AND price_delta = 0) OR
    (type = 'reversal' AND reversed_log_id IS NOT NULL) OR
    (type = 'init' AND done_lesson_delta >= 0 AND total_lesson_delta >= done_lesson_delta AND price_delta >= 0) OR
    (type = 'top_up' AND done_lesson_delta = 0 AND total_lesson_delta > 0 AND price_delta >= 0)
  )
);

-- Performance Indexes
CREATE INDEX idx_user_profiles_family_id ON user_profiles(family_id);
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_classes_family_id ON classes(family_id);
CREATE INDEX idx_classes_member_id ON classes(member_id);
CREATE INDEX idx_logs_family_id ON logs(family_id);
CREATE INDEX idx_logs_class_id ON logs(class_id);
CREATE INDEX idx_logs_reversed_log_id ON logs(reversed_log_id);
CREATE INDEX idx_logs_class_instance ON logs(class_id, schedule_instance_key) WHERE schedule_instance_key IS NOT NULL;

-- 7. Idempotency Constraints
-- Only one reversal per original log
CREATE UNIQUE INDEX unique_reversal_per_log
ON logs (reversed_log_id)
WHERE type = 'reversal' AND reversed_log_id IS NOT NULL;

-- Semantic validation for logs (BEFORE INSERT)
CREATE OR REPLACE FUNCTION validate_log_insert()
RETURNS TRIGGER AS $$
DECLARE
  target_log RECORD;
  existing_active_log_id UUID;
BEGIN
  -- Validate class is not deleted
  IF EXISTS (SELECT 1 FROM classes WHERE id = NEW.class_id AND is_deleted = TRUE) THEN
    RAISE EXCEPTION 'Cannot create logs for a deleted class.';
  END IF;

  -- Idempotency: check_in and skip must have a schedule instance key
  IF NEW.type IN ('check_in', 'skip') AND NEW.schedule_instance_key IS NULL THEN
     RAISE EXCEPTION 'check_in and skip logs must provide a schedule_instance_key.';
  END IF;

  -- Validate reversal semantics
  IF NEW.type = 'reversal' THEN
    IF NEW.reversed_log_id IS NULL THEN
      RAISE EXCEPTION 'Reversal log must specify reversed_log_id';
    END IF;
    
    SELECT * INTO target_log FROM logs WHERE id = NEW.reversed_log_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Target log for reversal not found';
    END IF;
    
    -- Tenant Consistency Check
    IF target_log.family_id != NEW.family_id OR target_log.class_id != NEW.class_id THEN
      RAISE EXCEPTION 'Reversal log must belong to the same family and class';
    END IF;
    
    IF target_log.type = 'reversal' THEN
      RAISE EXCEPTION 'Cannot reverse a reversal log';
    END IF;

    IF target_log.type NOT IN ('check_in', 'skip', 'top_up', 'init') THEN
      RAISE EXCEPTION 'Only check_in, skip, top_up, and init logs can be reversed by this RPC contract';
    END IF;
    
    -- Must exactly offset original deltas
    IF NEW.done_lesson_delta != -target_log.done_lesson_delta OR
       NEW.total_lesson_delta != -target_log.total_lesson_delta OR
       NEW.price_delta != -target_log.price_delta THEN
      RAISE EXCEPTION 'Reversal deltas must exactly offset the original log deltas';
    END IF;
  END IF;

  -- Idempotency: Validate schedule_instance_key uniqueness for active events
  IF NEW.type IN ('check_in', 'skip') AND NEW.schedule_instance_key IS NOT NULL THEN
    -- Serialize concurrent inserts for the same schedule instance before checking active logs.
    PERFORM pg_advisory_xact_lock(
      hashtextextended(NEW.family_id::text || ':' || NEW.class_id::text || ':' || NEW.schedule_instance_key, 0)
    );

    -- Look for an active (un-reversed) log for this instance
    -- Note: Since this is BEFORE INSERT, the new log isn't in the table yet.
    SELECT l.id INTO existing_active_log_id
    FROM logs l
    LEFT JOIN logs r ON r.reversed_log_id = l.id AND r.type = 'reversal'
    WHERE l.class_id = NEW.class_id 
      AND l.schedule_instance_key = NEW.schedule_instance_key
      AND l.type IN ('check_in', 'skip')
      AND r.id IS NULL -- Meaning it hasn't been reversed
    LIMIT 1;

    IF existing_active_log_id IS NOT NULL THEN
      RAISE EXCEPTION 'An active check_in or skip already exists for this schedule instance.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_log_insert
BEFORE INSERT ON logs
FOR EACH ROW
EXECUTE FUNCTION validate_log_insert();

-- 8. Event Sourcing Trigger (Project logs onto classes)
CREATE OR REPLACE FUNCTION process_class_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Temporarily disable the protection trigger
  PERFORM set_config('app.is_log_trigger', 'true', true);

  -- Update the class with the raw deltas. The CHECK constraints on the table will prevent illegal states.
  UPDATE classes 
  SET 
    done_lessons = done_lessons + NEW.done_lesson_delta,
    total_lessons = total_lessons + NEW.total_lesson_delta,
    total_price = total_price + NEW.price_delta
  WHERE id = NEW.class_id AND family_id = NEW.family_id;
  
  -- Tenant Consistency & Projection check
  IF NOT FOUND THEN
    PERFORM set_config('app.is_log_trigger', 'false', true);
    RAISE EXCEPTION 'Target class not found for projection update or family mismatch.';
  END IF;

  -- Reset the protection trigger variable
  PERFORM set_config('app.is_log_trigger', 'false', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_project_log_insert
AFTER INSERT ON logs
FOR EACH ROW
EXECUTE FUNCTION process_class_log();

CREATE OR REPLACE FUNCTION prevent_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Updates and Deletes are strictly forbidden on the event-sourced logs table. Use a reversal event.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_log_mutation
BEFORE UPDATE OR DELETE ON logs
FOR EACH ROW
EXECUTE FUNCTION prevent_log_mutation();

-- 9. Helper to create a new family and link the current auth user
CREATE OR REPLACE FUNCTION create_new_family()
RETURNS UUID AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous 0, O, 1, I
  new_invite_code VARCHAR(6);
  new_family_id UUID;
  i INTEGER := 0;
  max_retries CONSTANT INTEGER := 10;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to create a family.';
  END IF;

  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Current user already belongs to a family.';
  END IF;

  FOR attempts IN 1..max_retries LOOP
    BEGIN
      new_invite_code := '';
      FOR i IN 1..6 LOOP
        new_invite_code := new_invite_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      
      INSERT INTO families (invite_code) VALUES (new_invite_code) RETURNING id INTO new_family_id;
      
      INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), new_family_id, 'creator');
      
      RETURN new_family_id;
      
    EXCEPTION WHEN unique_violation THEN
      IF attempts = max_retries THEN
        RAISE EXCEPTION 'Could not generate a unique invite code after % attempts.', max_retries;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Helper to join an existing family
CREATE OR REPLACE FUNCTION join_family(invite_code_input VARCHAR)
RETURNS UUID AS $$
DECLARE
  target_family_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to join a family.';
  END IF;

  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Current user already belongs to a family.';
  END IF;

  SELECT id INTO target_family_id FROM families WHERE invite_code = upper(trim(invite_code_input));
  
  IF target_family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code.';
  END IF;
  
  INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), target_family_id, 'member');
  
  RETURN target_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Controlled class and log write RPCs
CREATE OR REPLACE FUNCTION create_class_with_init(
  member_id_input UUID,
  name_input VARCHAR,
  unit_type_input VARCHAR,
  client_event_id_input TEXT,
  total_lessons_input DECIMAL DEFAULT 0,
  done_lessons_input DECIMAL DEFAULT 0,
  total_price_input DECIMAL DEFAULT 0,
  currency_input VARCHAR DEFAULT '¥',
  duration_input INT DEFAULT 60,
  schedule_input JSONB DEFAULT '[]'::JSONB,
  occurred_at_input TIMESTAMPTZ DEFAULT NOW(),
  note_input TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  current_family_id UUID;
  new_class_id UUID;
BEGIN
  current_family_id := get_current_family_id();

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'Current user must belong to a family before creating classes.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM members
    WHERE id = member_id_input AND family_id = current_family_id AND is_deleted = FALSE
  ) THEN
    RAISE EXCEPTION 'Member not found in current family.';
  END IF;

  INSERT INTO classes (family_id, member_id, name, currency, unit_type, duration, schedule)
  VALUES (current_family_id, member_id_input, name_input, currency_input, unit_type_input, duration_input, schedule_input)
  RETURNING id INTO new_class_id;

  INSERT INTO logs (
    family_id,
    class_id,
    client_event_id,
    type,
    done_lesson_delta,
    total_lesson_delta,
    price_delta,
    occurred_at,
    note
  ) VALUES (
    current_family_id,
    new_class_id,
    client_event_id_input,
    'init',
    done_lessons_input,
    total_lessons_input,
    total_price_input,
    occurred_at_input,
    note_input
  );

  RETURN new_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_in_class(
  class_id_input UUID,
  client_event_id_input TEXT,
  schedule_instance_key_input VARCHAR,
  occurred_at_input TIMESTAMPTZ DEFAULT NOW(),
  lesson_delta_input DECIMAL DEFAULT 1,
  note_input TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  current_family_id UUID;
  new_log_id UUID;
BEGIN
  current_family_id := get_current_family_id();

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'Current user must belong to a family before checking in.';
  END IF;

  IF lesson_delta_input <= 0 THEN
    RAISE EXCEPTION 'check_in lesson delta must be positive.';
  END IF;

  INSERT INTO logs (
    family_id,
    class_id,
    client_event_id,
    type,
    done_lesson_delta,
    total_lesson_delta,
    price_delta,
    occurred_at,
    schedule_instance_key,
    note
  ) VALUES (
    current_family_id,
    class_id_input,
    client_event_id_input,
    'check_in',
    lesson_delta_input,
    0,
    0,
    occurred_at_input,
    schedule_instance_key_input,
    note_input
  ) RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION skip_class(
  class_id_input UUID,
  client_event_id_input TEXT,
  schedule_instance_key_input VARCHAR,
  occurred_at_input TIMESTAMPTZ DEFAULT NOW(),
  note_input TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  current_family_id UUID;
  new_log_id UUID;
BEGIN
  current_family_id := get_current_family_id();

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'Current user must belong to a family before skipping a class.';
  END IF;

  INSERT INTO logs (
    family_id,
    class_id,
    client_event_id,
    type,
    occurred_at,
    schedule_instance_key,
    note
  ) VALUES (
    current_family_id,
    class_id_input,
    client_event_id_input,
    'skip',
    occurred_at_input,
    schedule_instance_key_input,
    note_input
  ) RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION top_up_class(
  class_id_input UUID,
  client_event_id_input TEXT,
  total_lesson_delta_input DECIMAL,
  price_delta_input DECIMAL DEFAULT 0,
  occurred_at_input TIMESTAMPTZ DEFAULT NOW(),
  note_input TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  current_family_id UUID;
  new_log_id UUID;
BEGIN
  current_family_id := get_current_family_id();

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'Current user must belong to a family before topping up.';
  END IF;

  INSERT INTO logs (
    family_id,
    class_id,
    client_event_id,
    type,
    done_lesson_delta,
    total_lesson_delta,
    price_delta,
    occurred_at,
    note
  ) VALUES (
    current_family_id,
    class_id_input,
    client_event_id_input,
    'top_up',
    0,
    total_lesson_delta_input,
    price_delta_input,
    occurred_at_input,
    note_input
  ) RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION reverse_log(
  target_log_id_input UUID,
  client_event_id_input TEXT,
  occurred_at_input TIMESTAMPTZ DEFAULT NOW(),
  note_input TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  current_family_id UUID;
  target_log RECORD;
  new_log_id UUID;
BEGIN
  current_family_id := get_current_family_id();

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'Current user must belong to a family before reversing logs.';
  END IF;

  SELECT * INTO target_log
  FROM logs
  WHERE id = target_log_id_input AND family_id = current_family_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target log not found in current family.';
  END IF;

  INSERT INTO logs (
    family_id,
    class_id,
    client_event_id,
    type,
    done_lesson_delta,
    total_lesson_delta,
    price_delta,
    occurred_at,
    reversed_log_id,
    schedule_instance_key,
    note
  ) VALUES (
    current_family_id,
    target_log.class_id,
    client_event_id_input,
    'reversal',
    -target_log.done_lesson_delta,
    -target_log.total_lesson_delta,
    -target_log.price_delta,
    occurred_at_input,
    target_log.id,
    target_log.schedule_instance_key,
    note_input
  ) RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION create_new_family() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION join_family(VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_class_with_init(UUID, VARCHAR, VARCHAR, TEXT, DECIMAL, DECIMAL, DECIMAL, VARCHAR, INT, JSONB, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_in_class(UUID, TEXT, VARCHAR, TIMESTAMPTZ, DECIMAL, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION skip_class(UUID, TEXT, VARCHAR, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION top_up_class(UUID, TEXT, DECIMAL, DECIMAL, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reverse_log(UUID, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_new_family() TO authenticated;
GRANT EXECUTE ON FUNCTION join_family(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_class_with_init(UUID, VARCHAR, VARCHAR, TEXT, DECIMAL, DECIMAL, DECIMAL, VARCHAR, INT, JSONB, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_class(UUID, TEXT, VARCHAR, TIMESTAMPTZ, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION skip_class(UUID, TEXT, VARCHAR, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION top_up_class(UUID, TEXT, DECIMAL, DECIMAL, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reverse_log(UUID, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;

-- 12. Enable RLS and setup policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_current_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION get_current_family_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_family_id() TO authenticated;

-- user_profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

-- families policies
CREATE POLICY "Users can view their own family" ON families FOR SELECT USING (id = get_current_family_id());

-- members policies
CREATE POLICY "Users can view family members" ON members FOR SELECT USING (family_id = get_current_family_id());
CREATE POLICY "Users can insert family members" ON members FOR INSERT WITH CHECK (family_id = get_current_family_id());
CREATE POLICY "Users can update family members" ON members FOR UPDATE USING (family_id = get_current_family_id());

-- classes policies
CREATE POLICY "Users can view family classes" ON classes FOR SELECT USING (family_id = get_current_family_id());
CREATE POLICY "Users can insert family classes" ON classes FOR INSERT WITH CHECK (family_id = get_current_family_id());
CREATE POLICY "Users can update family classes" ON classes FOR UPDATE USING (family_id = get_current_family_id());

-- logs policies
CREATE POLICY "Users can view family logs" ON logs FOR SELECT USING (family_id = get_current_family_id());
