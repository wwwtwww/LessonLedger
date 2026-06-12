-- Disable triggers temporarily during rebuild
SET session_replication_role = replica;

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  currency VARCHAR(10) DEFAULT '¥',
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('lesson', 'session')),
  duration INT DEFAULT 60,
  schedule JSONB DEFAULT '[]'::JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create logs table (Event Sourced Ledger)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('check_in', 'skip', 'top_up', 'init', 'reversal', 'adjustment', 'refund', 'bonus')),
  done_lesson_delta DECIMAL(10,2) DEFAULT 0 NOT NULL,
  total_lesson_delta DECIMAL(10,2) DEFAULT 0 NOT NULL,
  price_delta DECIMAL(10,2) DEFAULT 0 NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reversed_log_id UUID REFERENCES logs(id), -- For reversals
  schedule_instance_key VARCHAR(255), -- For idempotency (class_id + date + time)
  note TEXT
);

-- Performance Indexes
CREATE INDEX idx_user_profiles_family_id ON user_profiles(family_id);
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_classes_family_id ON classes(family_id);
CREATE INDEX idx_classes_member_id ON classes(member_id);
CREATE INDEX idx_logs_family_id ON logs(family_id);
CREATE INDEX idx_logs_class_id ON logs(class_id);

-- 7. Idempotency Constraints
-- Only one reversal per original log
CREATE UNIQUE INDEX unique_reversal_per_log
ON logs (reversed_log_id)
WHERE type = 'reversal' AND reversed_log_id IS NOT NULL;

-- 8. Event Sourcing Trigger (Project logs onto classes)
CREATE OR REPLACE FUNCTION process_class_log()
RETURNS TRIGGER AS $$
BEGIN
  -- We ONLY handle INSERT. Logs are append-only.
  IF TG_OP = 'INSERT' THEN
    -- Update the class with the raw deltas. The CHECK constraints on the table will prevent illegal states.
    UPDATE classes 
    SET 
      done_lessons = done_lessons + NEW.done_lesson_delta,
      total_lessons = total_lessons + NEW.total_lesson_delta,
      total_price = total_price + NEW.price_delta
    WHERE id = NEW.class_id;
    
    RETURN NEW;
  END IF;
  
  -- Prevent UPDATE and DELETE on logs completely to enforce append-only
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Updates and Deletes are strictly forbidden on the event-sourced logs table. Use a reversal event.';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_inserted_or_deleted
AFTER INSERT OR UPDATE OR DELETE ON logs
FOR EACH ROW
EXECUTE FUNCTION process_class_log();

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
  FOR attempts IN 1..max_retries LOOP
    BEGIN
      new_invite_code := '';
      FOR i IN 1..6 LOOP
        new_invite_code := new_invite_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      
      INSERT INTO families (invite_code) VALUES (new_invite_code) RETURNING id INTO new_family_id;
      
      INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), new_family_id, 'creator')
      ON CONFLICT (id) DO UPDATE SET family_id = new_family_id, role = 'creator';
      
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
  SELECT id INTO target_family_id FROM families WHERE invite_code = invite_code_input;
  
  IF target_family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code.';
  END IF;
  
  INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), target_family_id, 'member')
  ON CONFLICT (id) DO UPDATE SET family_id = target_family_id, role = 'member';
  
  RETURN target_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Enable RLS and setup policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_current_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

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
CREATE POLICY "Users can insert family logs" ON logs FOR INSERT WITH CHECK (family_id = get_current_family_id());
-- Note: DELETE/UPDATE is forbidden by the trigger above anyway.