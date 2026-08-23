# Repository structure steering

## Directory ownership

```text
.kiro/             Kiro steering and specifications; must be committed
apps/api/app/      FastAPI runtime code
apps/api/tests/    Backend unit/contract tests
frontend/app/      Expo Router screens and routes
frontend/components/ Reusable mobile UI
frontend/contexts/ Shared client state
frontend/lib/      API, auth, linking, and geometry helpers
supabase/migrations/ Versioned database schema, RLS, functions, and grants
docs/              Architecture, API contracts, deployment, and testing guides
```

## Change rules

- Pull `main` before starting a work session.
- Preserve teammate work and isolate unrelated edits.
- Add a migration instead of editing an already deployed migration.
- Update `docs/api-contracts.md` when a request/response contract changes.
- Update both environment examples and setup docs when configuration changes.
- Keep generated folders, local service state, build outputs, and credentials out
  of Git.
- Remove unused starter assets only after verifying there are no source or app
  configuration references.
- Run backend and frontend quality gates before merging.

## Naming

- The product name is **Pinara** in user-facing copy.
- Database/API resources use `trip`; the current UI may label the same concept
  as a group.
- Preference keys are stable machine identifiers; labels may change without
  changing stored keys.
- Public API base paths and database identifiers use lowercase snake/kebab case
  appropriate to their layer.
