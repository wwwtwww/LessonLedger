# V2 Database & Auth Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Supabase database from scratch to support multi-tenant `family_id` isolation, event-sourced logging, and anonymous auth.

**Architecture:** We will create a single unified SQL DDL script (`supabase/migrations/00_init_v2.sql`) that drops all existing tables and recreates `families`, `user_profiles`, `members`, `classes`, and `logs`. We will enable RLS on all tables and create a trigger to auto-calculate `classes.doneLessons` from the `logs` table.

**Tech Stack:** PostgreSQL, Supabase, SQL.

---

### Task 1: Create the DDL Script for Core Tables

**Files:**
- Create: `supabase/migrations/00_init_v2.sql`

**Step 1: Write the minimal implementation for table creation**

We don't have automated SQL tests set up, so our "test" will be the successful execution of this script in the Supabase SQL editor later.

Create `supabase/migrations/00_init_v2.sql` with the following content to drop old tables and create the new structure.

```sql
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
```

**Step 2: Commit**

```bash
git add supabase/migrations/00_init_v2.sql
git commit -m "chore(db): create initial V2 table schemas"
```

---

### Task 2: Implement Event-Sourcing Trigger

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

**Step 1: Write the Trigger function**

Append the following trigger logic to the end of `00_init_v2.sql`. This trigger will listen for inserts and deletes on the `logs` table and update the `done_lessons` count in `classes`.
*(Note: A check_in is `amount: -1`, meaning it consumes a lesson. So done_lessons should increase when amount is negative. Wait, the PRD says: "doneLessons: 已消费课时数". If amount is -1, it means we spent 1 lesson. So doneLessons = doneLessons + ABS(amount)? Let's use a simpler logic: Check-in adds to doneLessons. Let's make `amount` represent the change to `total_lessons` or `remaining_lessons`? The PRD says: "课时变动数量，如打卡记 -1，续费记 +20，期初建账记 -X". This means amount represents change to REMAINING lessons. So `done_lessons = total_lessons - remaining`. Let's clarify: Supabase should just calculate `done_lessons`. Wait, if Top-up is +20, it means `total_lessons` increases by 20. If Check-in is -1, `done_lessons` increases by 1. To keep it simple, let's just make the trigger handle it specifically by `type`.)*

Append to `00_init_v2.sql`:

```sql
-- 7. Create trigger function to update classes table based on logs
CREATE OR REPLACE FUNCTION process_class_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'check_in' THEN
      UPDATE classes SET done_lessons = done_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    ELSIF NEW.type = 'init' THEN
      UPDATE classes SET done_lessons = ABS(NEW.amount) WHERE id = NEW.class_id;
    ELSIF NEW.type = 'top_up' THEN
      UPDATE classes SET total_lessons = total_lessons + ABS(NEW.amount) WHERE id = NEW.class_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'check_in' THEN
      UPDATE classes SET done_lessons = GREATEST(0, done_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    ELSIF OLD.type = 'top_up' THEN
      UPDATE classes SET total_lessons = GREATEST(0, total_lessons - ABS(OLD.amount)) WHERE id = OLD.class_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_inserted_or_deleted
AFTER INSERT OR DELETE ON logs
FOR EACH ROW
EXECUTE FUNCTION process_class_log();
```

**Step 2: Commit**

```bash
git add supabase/migrations/00_init_v2.sql
git commit -m "chore(db): add trigger for event-sourced logging"
```

---

### Task 3: Implement Invite Code RPC

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

**Step 1: Write the RPC function**

Append the logic to generate a unique 6-character code to `00_init_v2.sql`.

```sql
-- 8. Create RPC for unique invite code generation
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER := 0;
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if it exists
    PERFORM 1 FROM families WHERE invite_code = result;
    IF NOT FOUND THEN
      is_unique := TRUE;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper to create a new family and link the current auth user
CREATE OR REPLACE FUNCTION create_new_family()
RETURNS UUID AS $$
DECLARE
  new_family_id UUID;
  new_invite_code VARCHAR(6);
BEGIN
  -- 1. Generate code
  new_invite_code := generate_unique_invite_code();
  
  -- 2. Create family
  INSERT INTO families (invite_code) VALUES (new_invite_code) RETURNING id INTO new_family_id;
  
  -- 3. Link current user
  INSERT INTO user_profiles (id, family_id, role) VALUES (auth.uid(), new_family_id, 'creator');
  
  RETURN new_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Commit**

```bash
git add supabase/migrations/00_init_v2.sql
git commit -m "chore(db): add rpc for invite code and family creation"
```

---

### Task 4: Setup Row Level Security (RLS)

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

**Step 1: Write RLS policies**

Append RLS logic to ensure users only see data for their `family_id`.

```sql
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
$$ LANGUAGE sql STABLE;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
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
```

**Step 2: Commit**

```bash
git add supabase/migrations/00_init_v2.sql
git commit -m "chore(db): enable RLS and add tenant isolation policies"
```
