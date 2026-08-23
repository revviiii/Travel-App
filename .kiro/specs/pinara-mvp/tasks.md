# Pinara MVP implementation tasks

The checklist records the Kiro-directed implementation sequence and the final
review state. Checked items are represented in the submitted source.

## Foundation

- [x] Establish the Expo, FastAPI, Supabase, and documentation repository layout.
- [x] Add safe environment examples and ignore local secrets/generated state.
- [x] Add FastAPI health, logging, CORS, Docker, Render Blueprint, and tests.
- [x] Add Supabase migrations, seed data, constraints, functions, grants, and RLS.

## Authentication and profile

- [x] Integrate Supabase email/password authentication.
- [x] Add Google OAuth callback for the native Pinara scheme.
- [x] Route first-time users through location and preference onboarding.
- [x] Add user profile, preference, goal, and avatar persistence.
- [x] Remove unsupported Apple and Facebook sign-in paths.

## Groups and collaboration

- [x] Add atomic group creation and owner membership.
- [x] Add group list/detail, rename, image update, and authorized deletion.
- [x] Add opaque seven-day invitations and app/web opening flow.
- [x] Add member profiles/preferences and Supabase Realtime refresh behavior.
- [x] Add shared goals.

## Google discovery and routing

- [x] Implement restricted Google Places nearby and text-search clients.
- [x] Normalize place IDs, names, addresses, coordinates, types, and photos.
- [x] Add adjustable radius, preference filters, destination search, and markers.
- [x] Preserve Google Maps details links and provider attribution.
- [x] Implement Routes distance/duration/polyline responses.
- [x] Add field masks, result/radius caps, per-user throttles, and error mapping.

## Scheduling and itinerary

- [x] Persist scheduled place proposals with date/time.
- [x] Restrict voting-mode control and finalization to the group leader.
- [x] Persist unique member votes and confirmation state.
- [x] Build chronological deterministic itineraries without a paid AI provider.
- [x] Export confirmed-only places to a writable device calendar.

## Tracks and completion

- [x] Add foreground travel-track recording, review, save, list, and pre-save discard.
- [x] Add full phone/local testing, API, deployment, and handoff documentation.
- [x] Add README setup, usage, configuration, costs, limits, tests, credentials,
  attribution, team contributions, and Kiro-use explanation.
- [x] Commit the root `.kiro` materials required for judge inspection.
- [ ] Record/publish the final public demo video and place its URL in the
  hackathon submission form.
- [ ] Run the final two-account device smoke test immediately before submission.
