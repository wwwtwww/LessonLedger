const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '00_init_v2.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const checks = [
  {
    name: 'members has composite tenant key for classes foreign key',
    pattern: /CREATE TABLE members[\s\S]*?UNIQUE\s*\(\s*id\s*,\s*family_id\s*\)[\s\S]*?\);/i,
  },
  {
    name: 'logs event type is limited to MVP events',
    pattern: /type VARCHAR\(50\) NOT NULL CHECK \(type IN \('check_in', 'skip', 'top_up', 'init', 'reversal'\)\)/i,
  },
  {
    name: 'future unrestricted event types are absent',
    forbidden: /'adjustment'|'refund'|'bonus'/i,
  },
  {
    name: 'logs has stable client event id',
    pattern: /client_event_id\s+TEXT\s+NOT\s+NULL/i,
  },
  {
    name: 'logs has family-scoped client event uniqueness',
    pattern: /UNIQUE\s*\(\s*family_id\s*,\s*client_event_id\s*\)/i,
  },
  {
    name: 'schedule idempotency uses advisory transaction lock',
    pattern: /pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\(/i,
  },
  {
    name: 'reversal is limited to reversible event types',
    pattern: /target_log\.type\s+NOT\s+IN\s*\(\s*'check_in'\s*,\s*'skip'\s*,\s*'top_up'\s*,\s*'init'\s*\)/i,
  },
  {
    name: 'classes insert protects derived fields',
    pattern: /CREATE TRIGGER trg_protect_class_derived_fields\s+BEFORE INSERT OR UPDATE ON classes/i,
  },
  {
    name: 'log projection function is security definer',
    pattern: /CREATE OR REPLACE FUNCTION process_class_log\(\)[\s\S]*?END;\s*\$\$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;/i,
  },
  {
    name: 'direct client log inserts are not exposed by policy',
    pattern: /CREATE POLICY "Users can view family logs" ON logs FOR SELECT USING[\s\S]*$/i,
    forbidden: /CREATE POLICY "Users can insert family logs"/i,
  },
  {
    name: 'create class rpc exists',
    pattern: /CREATE OR REPLACE FUNCTION create_class_with_init\(/i,
  },
  {
    name: 'check in rpc exists',
    pattern: /CREATE OR REPLACE FUNCTION check_in_class\(/i,
  },
  {
    name: 'skip rpc exists',
    pattern: /CREATE OR REPLACE FUNCTION skip_class\(/i,
  },
  {
    name: 'top up rpc exists',
    pattern: /CREATE OR REPLACE FUNCTION top_up_class\(/i,
  },
  {
    name: 'reverse log rpc exists',
    pattern: /CREATE OR REPLACE FUNCTION reverse_log\(/i,
  },
  {
    name: 'create_new_family requires auth uid',
    pattern: /CREATE OR REPLACE FUNCTION create_new_family\(\)[\s\S]*auth\.uid\(\)\s+IS\s+NULL[\s\S]*RAISE EXCEPTION/i,
  },
  {
    name: 'join_family requires auth uid',
    pattern: /CREATE OR REPLACE FUNCTION join_family\([\s\S]*auth\.uid\(\)\s+IS\s+NULL[\s\S]*RAISE EXCEPTION/i,
  },
  {
    name: 'rpc public execute permission is revoked',
    pattern: /REVOKE EXECUTE ON FUNCTION create_new_family\(\) FROM PUBLIC;[\s\S]*REVOKE EXECUTE ON FUNCTION join_family\(VARCHAR\) FROM PUBLIC;/i,
  },
  {
    name: 'log append-only protection uses before trigger',
    pattern: /CREATE TRIGGER trg_prevent_log_mutation\s+BEFORE UPDATE OR DELETE ON logs/i,
  },
  {
    name: 'insert projection trigger only handles insert',
    pattern: /CREATE TRIGGER trg_project_log_insert\s+AFTER INSERT ON logs/i,
  },
];

const failures = checks.filter((check) => {
  const missingRequiredPattern = check.pattern && !check.pattern.test(sql);
  const foundForbiddenPattern = check.forbidden && check.forbidden.test(sql);
  return missingRequiredPattern || foundForbiddenPattern;
});

if (failures.length > 0) {
  console.error('00_init_v2.sql validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log('00_init_v2.sql validation passed.');
