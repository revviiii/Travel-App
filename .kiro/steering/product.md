# Pinara product steering

## Purpose

Pinara reduces the coordination cost of planning a group trip. It combines real
place discovery, shared decisions, scheduling, routing, and a lightweight travel
record in one mobile workflow.

## Primary users

- A group leader who creates a trip, invites members, controls optional voting,
  and can finalize the itinerary.
- Group members who discover places, propose dated stops, vote, and follow the
  confirmed plan.
- An individual traveller who manages profile preferences, goals, and saved
  tracks.

## Core workflow

1. Authenticate and complete first-run location/preferences onboarding.
2. Create a group or accept a secure invitation.
3. Search a destination or browse recommendations near a selected point.
4. Select a place and propose a date/time.
5. Resolve the proposal through group votes or leader finalization.
6. View confirmed stops chronologically and open their route/details.
7. Export confirmed stops to a writable calendar.
8. Optionally record and save a travelled path.

## Product principles

- Group decisions must be visible and persistent.
- Recommendations must reflect the selected location, radius, and interests.
- A place is not calendar-ready until the group has confirmed it.
- Provider data and attribution must remain accurate and visible.
- The demo must remain usable without a paid generative-AI service.
- Permissions for location, photos, and calendars must be requested in context.

## Deliberate scope

The hackathon MVP includes foreground route recording, not continuous
background fitness tracking. It uses deterministic scheduling and group voting,
not generated itineraries. The public native test build targets Android; iPhone
testing can use Expo Go with email/password.
