# Event-Sourced Database RPC Design

## Goal

Rebuild `00_init_v2.sql` around a small set of controlled RPC write paths so course balances remain derived from immutable log events while avoiding unnecessary tables or premature permission complexity.

## Scope

This design covers only the Supabase database reset script and its static validation script:

- `supabase/migrations/00_init_v2.sql`
- `scripts/validate-init-v2-sql.js`

It does not update frontend calls in this pass.

## Data Model

Keep the five core tables:

- `families`
- `user_profiles`
- `members`
- `classes`
- `logs`

`classes.total_price`, `classes.total_lessons`, and `classes.done_lessons` are projection cache fields. They start at zero and can only be changed by the log projection trigger.

`logs` is the event source. MVP event types are limited to:

- `init`
- `check_in`
- `skip`
- `top_up`
- `reversal`

Future event types such as `adjustment`, `refund`, and `bonus` are intentionally excluded until product semantics and permissions are defined.

## Write Paths

Clients can read tables through RLS and can manage non-derived member/course metadata through ordinary policies. Balance-changing writes use RPC functions:

- `create_new_family()`
- `join_family(invite_code_input VARCHAR)`
- `create_class_with_init(...)`
- `check_in_class(...)`
- `skip_class(...)`
- `top_up_class(...)`
- `reverse_log(...)`

The client should not insert directly into `logs`. `logs` has no client `INSERT` policy; RPC functions insert logs as `SECURITY DEFINER` functions after validating tenant membership and business semantics.

## Consistency Rules

- Direct `classes INSERT` must create derived fields as zero only.
- Direct `classes UPDATE` must not change derived fields.
- `process_class_log()` runs as `SECURITY DEFINER` and checks `class_id` plus `family_id` before projection.
- `client_event_id` is unique per family and must be supplied by the client for offline idempotency.
- `check_in` and `skip` require `schedule_instance_key`.
- Only one active `check_in` or `skip` can exist per `class_id + schedule_instance_key`; reversal makes the original event inactive.
- `reversal` must point to a log in the same family/class and exactly offset the original deltas.

## Validation

The static validation script checks for the key invariants that are easy to regress in SQL text:

- controlled RPCs exist
- direct `logs INSERT` policy is absent
- future unrestricted event types are absent
- derived class fields are protected on insert and update
- log projection is `SECURITY DEFINER`
- RPC permissions are explicit
