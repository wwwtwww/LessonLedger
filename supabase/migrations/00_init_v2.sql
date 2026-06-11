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
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('creator', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('adult', 'kid')),
  avatar VARCHAR(255),
  theme_color VARCHAR(20),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  total_lessons INT NOT NULL,
  done_lessons INT DEFAULT 0,
  currency VARCHAR(10) DEFAULT '¥',
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('lesson', 'session')),
  duration INT DEFAULT 60,
  schedule JSONB DEFAULT '[]'::JSONB,
  notification_ids JSONB DEFAULT '[]'::JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create logs table (Event Sourced Ledger)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('check_in', 'skip', 'top_up', 'init')),
  amount INT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_user_profiles_family_id ON user_profiles(family_id);
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_classes_family_id ON classes(family_id);
CREATE INDEX idx_classes_member_id ON classes(member_id);
CREATE INDEX idx_logs_family_id ON logs(family_id);
CREATE INDEX idx_logs_class_id ON logs(class_id);

-- 7. Create trigger function to update classes table based on logs
CREATE OR REPLACE FUNCTION process_class_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'check_in' THEN
      UPDATE classes SET done_lessons = done_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    ELSIF NEW.type = 'init' THEN
      UPDATE classes SET done_lessons = done_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    ELSIF NEW.type = 'top_up' THEN
      UPDATE classes SET total_lessons = total_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'check_in' THEN
      UPDATE classes SET done_lessons = GREATEST(0, done_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    ELSIF OLD.type = 'top_up' THEN
      UPDATE classes SET total_lessons = GREATEST(0, total_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    ELSIF OLD.type = 'init' THEN
      UPDATE classes SET done_lessons = GREATEST(0, done_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old amount
    IF OLD.type = 'check_in' THEN
      UPDATE classes SET done_lessons = GREATEST(0, done_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    ELSIF OLD.type = 'top_up' THEN
      UPDATE classes SET total_lessons = GREATEST(0, total_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    ELSIF OLD.type = 'init' THEN
      UPDATE classes SET done_lessons = GREATEST(0, done_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    END IF;
    -- Apply new amount
    IF NEW.type = 'check_in' THEN
      UPDATE classes SET done_lessons = done_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    ELSIF NEW.type = 'init' THEN
      UPDATE classes SET done_lessons = done_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    ELSIF NEW.type = 'top_up' THEN
      UPDATE classes SET total_lessons = total_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_inserted_or_deleted
AFTER INSERT OR UPDATE OR DELETE ON logs
FOR EACH ROW
EXECUTE FUNCTION process_class_log();

-- 8. Helper to create a new family and link the current auth user
CREATE OR REPLACE FUNCTION create_new_family()
RETURNS UUID AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous 0, O, 1, I
  new_invite_code VARCHAR(6);
  new_family_id UUID;
  i INTEGER := 0;
  max_retries CONSTANT INTEGER := 10;
BEGIN
  -- Generate code and insert atomically to prevent race conditions
  FOR attempts IN 1..max_retries LOOP
    BEGIN
      new_invite_code := '';
      FOR i IN 1..6 LOOP
        new_invite_code := new_invite_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      
      -- Attempt atomic insert. Will throw unique_violation if code exists.
      INSERT INTO families (invite_code) VALUES (new_invite_code) RETURNING id INTO new_family_id;
      
      -- Link current user
      INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), new_family_id, 'creator')
      ON CONFLICT (id) DO UPDATE SET family_id = new_family_id, role = 'creator';
      
      RETURN new_family_id;
      
    EXCEPTION WHEN unique_violation THEN
      -- If collision occurs, the loop will retry
      IF attempts = max_retries THEN
        RAISE EXCEPTION 'Could not generate a unique invite code after % attempts.', max_retries;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Helper to get current user's family_id
CREATE OR REPLACE FUNCTION get_current_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
-- Note: Insert into user_profiles is handled securely by RPCs, so we don't need a wide-open RLS policy for insert.
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for families
CREATE POLICY "Users can view their own family" ON families FOR SELECT USING (id = get_current_family_id());

-- Policies for members
CREATE POLICY "Users can view family members" ON members FOR SELECT USING (family_id = get_current_family_id());
CREATE POLICY "Users can insert family members" ON members FOR INSERT WITH CHECK (family_id = get_current_family_id());
CREATE POLICY "Users can update family members" ON members FOR UPDATE USING (family_id = get_current_family_id());

-- Policies for classes
CREATE POLICY "Users can view family classes" ON classes FOR SELECT USING (family_id = get_current_family_id());
CREATE POLICY "Users can insert family classes" ON classes FOR INSERT WITH CHECK (family_id = get_current_family_id());
CREATE POLICY "Users can update family classes" ON classes FOR UPDATE USING (family_id = get_current_family_id());

-- Policies for logs
CREATE POLICY "Users can view family logs" ON logs FOR SELECT USING (family_id = get_current_family_id());
CREATE POLICY "Users can insert family logs" ON logs FOR INSERT WITH CHECK (family_id = get_current_family_id());
CREATE POLICY "Users can delete family logs" ON logs FOR DELETE USING (family_id = get_current_family_id());

-- 10. Helper to join an existing family
CREATE OR REPLACE FUNCTION join_family(invite_code_input VARCHAR)
RETURNS UUID AS $$
DECLARE
  target_family_id UUID;
BEGIN
  -- Find the family by invite code
  SELECT id INTO target_family_id FROM families WHERE invite_code = invite_code_input;
  
  IF target_family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code.';
  END IF;
  
  -- Link current user
  INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), target_family_id, 'member')
  ON CONFLICT (id) DO UPDATE SET family_id = target_family_id, role = 'member';
  
  RETURN target_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
