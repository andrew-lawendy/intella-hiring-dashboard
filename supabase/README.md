# Supabase Setup

## Running Migrations

Run each file in `migrations/` in order via Supabase Dashboard → SQL Editor:

1. `001_initial_schema.sql` — creates all tables
2. `002_rls_policies.sql` — enables RLS and sets access policies
3. `003_audit_log_trigger.sql` — installs the audit log trigger

## Seeding Data

After running migrations, seed static data:

```bash
yarn seed
```

Then upload CVs:

```bash
yarn seed:cvs
```

## Migrating to Self-Hosted Postgres

1. `pg_dump` from Supabase
2. Restore to your Postgres container
3. Update `VITE_SUPABASE_URL` to your new DB endpoint
