# Supabase development

This directory owns the PostgreSQL schema, Row Level Security policies, and
development seed data.

Recommended workflow after installing the Supabase CLI and a Docker-compatible
runtime:

```powershell
supabase init
supabase start
supabase db reset
```

If `supabase init` reports that the directory already exists, preserve the
checked-in migrations and allow the CLI to create only its missing configuration
files. Never run `supabase db reset --linked` against a production project.
