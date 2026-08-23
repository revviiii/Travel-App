# Pinara MVP requirements

## 1. Authentication and onboarding

**User story:** As a traveller, I want a secure account and relevant onboarding
so that recommendations and shared data belong to me.

### Acceptance criteria

1. WHEN a new user submits a unique email and a valid password, THE SYSTEM SHALL
   create a Supabase Auth account and a matching profile.
2. WHEN a user authenticates for the first time, THE SYSTEM SHALL guide them
   through location and travel-interest onboarding before showing Home.
3. WHEN a user signs in with Google from a supported native build, THE SYSTEM
   SHALL return through Pinara's custom callback and establish a Supabase session.
4. IF authentication fails, THE SYSTEM SHALL show an actionable error without
   exposing provider secrets or raw internal objects.

## 2. Group collaboration

**User story:** As a group leader or member, I want a shared planning space so
that everyone sees the same trip decisions.

### Acceptance criteria

1. WHEN an authenticated user creates a group, THE SYSTEM SHALL persist the
   group and assign that user as owner/leader atomically.
2. WHEN a leader creates an invitation, THE SYSTEM SHALL issue an opaque,
   expiring link that another authenticated user can accept.
3. WHEN an invitation is accepted, THE SYSTEM SHALL add the user once and show
   their real profile/preferences to authorized members.
4. WHEN a leader edits or deletes a group, THE SYSTEM SHALL enforce ownership in
   both the API and database policies.
5. WHEN group places, votes, goals, itinerary, or membership change, THE SYSTEM
   SHALL allow members to refresh that state through Supabase Realtime events.

## 3. Place discovery and routes

**User story:** As a traveller, I want to explore my current area or another
destination so that I can build a trip anywhere.

### Acceptance criteria

1. WHEN location permission is granted, THE SYSTEM SHALL center the dashboard map
   and discovery requests on the current position.
2. WHEN a user searches a destination, THE SYSTEM SHALL move discovery to the
   selected place rather than the device position.
3. WHEN interests or radius change, THE SYSTEM SHALL issue a new Places request
   and update markers/cards with matching provider results.
4. THE SYSTEM SHALL show place photos when Google supplies them and preserve a
   Google Maps details link for additional information.
5. WHEN a route is requested, THE SYSTEM SHALL return distance, duration, and an
   encoded polyline without revealing the Google server key.
6. THE SYSTEM SHALL enforce result caps, field masks, and per-user request
   throttles to reduce accidental provider spend.

## 4. Proposals, voting, and itinerary

**User story:** As a group member, I want proposed places to become a clear
schedule only after the group decides.

### Acceptance criteria

1. WHEN a user adds a place, THE SYSTEM SHALL require a date and time before
   storing the scheduled proposal.
2. ONLY the group leader SHALL control whether voting is required.
3. WHEN all required members vote for a proposal, THE SYSTEM SHALL mark that
   place confirmed.
4. WHEN the leader finalizes authorized proposals, THE SYSTEM SHALL create a
   chronological itinerary from the selected dates and times.
5. THE SYSTEM SHALL visually distinguish confirmed places from undecided places.
6. THE SYSTEM SHALL export only confirmed places to a user-selected writable
   device calendar.

## 5. Profiles, goals, images, and tracks

### Acceptance criteria

1. WHEN a user changes their name, country, preferences, or avatar, THE SYSTEM
   SHALL persist and display the updated profile.
2. WHEN an authorized user chooses a group image, THE SYSTEM SHALL upload and
   display it for group members.
3. WHEN users add personal or shared goals, THE SYSTEM SHALL persist them under
   the correct owner/group and enforce access policies.
4. WHEN a user explicitly starts tracking and grants foreground location access,
   THE SYSTEM SHALL collect path points until the user stops.
5. WHEN tracking stops, THE SYSTEM SHALL let the user review, save, or discard
   the highlighted path.

## 6. Submission reproducibility and security

### Acceptance criteria

1. THE REPOSITORY SHALL include source, manifests, migrations, configuration
   examples, setup/usage/testing instructions, attribution, and `.kiro` files.
2. THE REPOSITORY SHALL NOT contain real passwords, private keys, access tokens,
   provider secrets, local databases, dependency folders, or build outputs.
3. THE README SHALL disclose service costs, application/provider limits, test
   access, known restrictions, team contributions, and meaningful Kiro usage.
4. Automated tests SHALL avoid real Google requests and paid API consumption.
