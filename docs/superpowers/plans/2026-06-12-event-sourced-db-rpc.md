# Event-Sourced DB RPC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Supabase clean-slate SQL script around controlled RPC write paths for event-sourced class balances.

**Architecture:** Keep the five-table schema, keep `logs` as the event source, and project log deltas into `classes` with a `SECURITY DEFINER` trigger. Balance-changing writes are exposed only through a minimal set of RPC functions; direct client `logs INSERT` is removed.

**Tech Stack:** PostgreSQL PL/pgSQL, Supabase RLS/RPC, Node.js static validation script.

---

## File Structure

- Modify `supabase/migrations/00_init_v2.sql`: schema, triggers, RLS policies, and RPC functions.
- Modify `scripts/validate-init-v2-sql.js`: static checks for database invariants.

## Task 1: Strengthen Static Validation

**Files:**
- Modify: `scripts/validate-init-v2-sql.js`

- [ ] **Step 1: Add failing validation checks**

Add checks requiring:

```js
{
  name: 'logs event type is limited to MVP events',
  pattern: /type VARCHAR\(50\) NOT NULL CHECK \(type IN \('check_in', 'skip', 'top_up', 'init', 'reversal'\)\)/i,
}
{
  name: 'classes insert protects derived fields',
  pattern: /CREATE TRIGGER trg_protect_class_derived_fields\s+BEFORE INSERT OR UPDATE ON classes/i,
}
{
  name: 'log projection function is security definer',
  pattern: /CREATE OR REPLACE FUNCTION process_class_log\(\)[\s\S]*?\$\$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;/i,
}
{
  name: 'direct client log inserts are not exposed by policy',
  pattern: /CREATE POLICY "Users can view family logs" ON logs FOR SELECT USING[\s\S]*$/i,
  forbidden: /CREATE POLICY "Users can insert family logs"/i,
}
{
  name: 'create class rpc exists',
  pattern: /CREATE OR REPLACE FUNCTION create_class_with_init\(/i,
}
{
  name: 'check in rpc exists',
  pattern: /CREATE OR REPLACE FUNCTION check_in_class\(/i,
}
{
  name: 'skip rpc exists',
  pattern: /CREATE OR REPLACE FUNCTION skip_class\(/i,
}
{
  name: 'top up rpc exists',
  pattern: /CREATE OR REPLACE FUNCTION top_up_class\(/i,
}
{
  name: 'reverse log rpc exists',
  pattern: /CREATE OR REPLACE FUNCTION reverse_log\(/i,
}
```

Also update validation logic so a check can have either `pattern` or `forbidden` or both.

- [ ] **Step 2: Run validation and verify it fails**

Run: `node scripts/validate-init-v2-sql.js`

Expected: failure listing at least missing RPC checks and direct client log insert policy.

## Task 2: Restrict Log Schema to MVP Events

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

- [ ] **Step 1: Update event type enum**

Change `logs.type` to:

```sql
type VARCHAR(50) NOT NULL CHECK (type IN ('check_in', 'skip', 'top_up', 'init', 'reversal')),
```

- [ ] **Step 2: Remove non-MVP delta branches**

Change the `CHECK` block to include only `skip`, `check_in`, `reversal`, `init`, and `top_up`.

- [ ] **Step 3: Run validation**

Run: `node scripts/validate-init-v2-sql.js`

Expected: still fails, but not on MVP event type.

## Task 3: Protect Derived Fields on Class Insert and Update

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

- [ ] **Step 1: Update protection function**

Make `protect_class_derived_fields()` handle `INSERT` by rejecting non-zero derived values unless the log trigger bypass is set.

```sql
IF TG_OP = 'INSERT' THEN
  IF COALESCE(NEW.done_lessons, 0) <> 0 OR
     COALESCE(NEW.total_lessons, 0) <> 0 OR
     COALESCE(NEW.total_price, 0) <> 0 THEN
    RAISE EXCEPTION 'Derived fields must start at zero. Use create_class_with_init to initialize balances.';
  END IF;

  RETURN NEW;
END IF;
```

- [ ] **Step 2: Update trigger declaration**

Change trigger to:

```sql
CREATE TRIGGER trg_protect_class_derived_fields
BEFORE INSERT OR UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION protect_class_derived_fields();
```

- [ ] **Step 3: Run validation**

Run: `node scripts/validate-init-v2-sql.js`

Expected: still fails, but not on class insert protection.

## Task 4: Make Log Projection Internal

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

- [ ] **Step 1: Mark projection function as SECURITY DEFINER**

Change the function ending to:

```sql
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

- [ ] **Step 2: Run validation**

Run: `node scripts/validate-init-v2-sql.js`

Expected: still fails, but not on projection function security.

## Task 5: Add Controlled RPC Write Functions

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

- [ ] **Step 1: Add `create_class_with_init`**

Add a `SECURITY DEFINER` function that:

- validates `auth.uid()` has a family
- inserts `classes` with derived fields left at zero
- inserts an `init` log with provided opening balances
- returns the class id

- [ ] **Step 2: Add `check_in_class`**

Add a `SECURITY DEFINER` function that inserts a `check_in` log with `done_lesson_delta = lesson_delta`, defaulting to `1`.

- [ ] **Step 3: Add `skip_class`**

Add a `SECURITY DEFINER` function that inserts a zero-delta `skip` log.

- [ ] **Step 4: Add `top_up_class`**

Add a `SECURITY DEFINER` function that inserts a `top_up` log.

- [ ] **Step 5: Add `reverse_log`**

Add a `SECURITY DEFINER` function that fetches the target log, validates tenant ownership, and inserts an exact offset `reversal` log.

- [ ] **Step 6: Run validation**

Run: `node scripts/validate-init-v2-sql.js`

Expected: still fails only if RLS or grants are not updated.

## Task 6: Restrict RLS and Grants

**Files:**
- Modify: `supabase/migrations/00_init_v2.sql`

- [ ] **Step 1: Remove direct logs insert policy**

Delete:

```sql
CREATE POLICY "Users can insert family logs" ON logs FOR INSERT WITH CHECK (family_id = get_current_family_id());
```

- [ ] **Step 2: Add explicit RPC grants**

Add `REVOKE EXECUTE FROM PUBLIC` and `GRANT EXECUTE TO authenticated` for every RPC.

- [ ] **Step 3: Restrict helper function grants**

Add explicit grants for `get_current_family_id()` if needed by clients; otherwise revoke public execution.

- [ ] **Step 4: Run validation**

Run: `node scripts/validate-init-v2-sql.js`

Expected: pass.

## Task 7: Final Verification

**Files:**
- Verify: `supabase/migrations/00_init_v2.sql`
- Verify: `scripts/validate-init-v2-sql.js`

- [ ] **Step 1: Run static SQL validation**

Run: `node scripts/validate-init-v2-sql.js`

Expected: `00_init_v2.sql validation passed.`

- [ ] **Step 2: Check available DB tooling**

Run: `Get-Command psql -ErrorAction SilentlyContinue`

Run: `Get-Command supabase -ErrorAction SilentlyContinue`

Expected: If a command exists, use it to run or lint the migration; if neither exists, report that only static verification was possible.

- [ ] **Step 3: Review diff**

Run: `git diff -- supabase/migrations/00_init_v2.sql scripts/validate-init-v2-sql.js`

Expected: diff contains only SQL/RPC validation changes.
