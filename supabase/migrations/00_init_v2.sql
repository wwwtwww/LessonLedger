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
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('adult', 'kid')),
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
  total_price DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_lessons INT DEFAULT 0 NOT NULL,
  done_lessons INT DEFAULT 0 NOT NULL,
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
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
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
