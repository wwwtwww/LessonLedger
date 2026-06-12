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
