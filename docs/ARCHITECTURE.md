# Wanderline Architecture

## Product goal

Wanderline is a collaborative travel workspace that works cleanly for one traveler and scales naturally to a group. Its core job is to keep planning, decisions, itinerary, travelers, money, saved places, packing, bookings, notes, weather, and trip history in one mobile-friendly source of truth.

The public portfolio release is deliberately usable without credentials. Its browser-local domain model is already shaped for the final Firebase Authentication + Firestore implementation so cloud wiring does not require another UI redesign.

## Runtime shape

```text
Browser
  React 19 + TypeScript
      |
      +-- Workspace v2
      |    +-- multiple trips
      |    +-- members + roles + pending invitations
      |    +-- activities + suggestions + votes
      |    +-- saved places
      |    +-- expenses + participants + split rules
      |    +-- packing ownership
      |    +-- notes + reservations
      |    +-- activity history
      |
      +-- storage.ts -> validated local persistence
      +-- firebase.ts -> optional Google authentication
      +-- theme.ts -> persisted appearance preference
      +-- weather.ts -> Open-Meteo destination weather
      +-- maps.ts -> Google Maps universal links
      +-- Web Share / clipboard fallback
      |
Express production host
      +-- /api/health
      +-- /api/config
      +-- static Vite build / SPA fallback
```

## Domain model

`src/model.ts` owns the canonical client domain.

### Workspace

A workspace contains:

- current local user id;
- active trip id;
- multiple trips;
- schema version (`2`) for safe browser persistence/migration.

### Trip

Each trip contains:

- shared trip details and USD budget;
- members;
- activities;
- saved places;
- expenses;
- packing items;
- notes;
- reservations;
- activity/history entries.

The interface derives totals, progress, balances, and counts from canonical state instead of storing duplicate display values.

## Collaboration model

Trip members use three roles:

- **Owner** — full trip/member management and destructive trip actions;
- **Editor** — can modify shared trip planning resources;
- **Viewer** — read-only shared trip experience.

The credential-free release can create pending invitations locally so the full membership UX is testable. Real invitation delivery, acceptance, authenticated membership, and real-time synchronization are intentionally the Firebase/Firestore boundary.

## Itinerary and ideas

Wanderline separates **suggestions** from the actual itinerary.

Activities support:

- `suggested`
- `planned`
- `confirmed`
- `completed`

Suggested activities live in the Ideas workspace and can receive member votes. Editors promote accepted ideas into the real itinerary.

The itinerary itself is a single chronological timeline with one card per activity. Saved places and ideas do not render as duplicate floating cards on top of that timeline. Each activity stores date, time, location, category, duration, USD cost, notes, creator, attendees, and votes.

## Saved-place workflow

Saved places are a collaborative wishlist. A place can be:

- created and edited;
- searched;
- removed;
- opened in Google Maps;
- converted directly into a prefilled itinerary activity.

This keeps discovery separate from committed plans while making promotion into the itinerary inexpensive.

## Google Maps integration

`src/maps.ts` builds standard Google Maps universal URLs for search and walking directions. These actions do not require a Maps JavaScript API key, billing account, or embedded map SDK.

This is intentional for the public portfolio release: users get familiar Google Maps handoff while the app remains credential-free. An embedded Google Maps SDK can be added later if in-app map interaction becomes valuable enough to justify provider billing/configuration.

## Weather

`src/weather.ts` first geocodes the active trip destination through Open-Meteo, then retrieves current conditions in Fahrenheit. Weather is non-critical; failures produce a useful fallback instead of blocking trip planning.

## Budget and settlement model

Expenses track:

- description and category;
- USD amount;
- paying member;
- participating members;
- split mode (`personal`, `equal`, or `custom`);
- optional custom shares.

Derived balance logic calculates what each traveler paid versus their assigned share. A settlement pass matches debtors and creditors to provide a concise “who owes whom” result.

Search filters only visible ledger rows; aggregate budget values always derive from the complete expense ledger.

## Packing model

Packing items are either:

- **personal** — assigned to one traveler;
- **shared** — group item with one explicit responsible traveler.

This prevents the common group-trip problem where everyone assumes somebody else packed a shared item.

## Notes and reservations

Shared notes hold practical context that does not belong to a specific activity. Reservations support flights, hotels, rental cars, restaurants, events, and other bookings with date/time/location, confirmation/reference values, and notes.

Locations open directly in Google Maps.

## Activity history

Important local mutations append lightweight history events containing member, text, and timestamp. In Firestore this becomes a natural append-only activity collection or subcollection and can later power notifications.

## Search and sharing

Global search spans:

- activities;
- saved places;
- expenses;
- notes;
- reservations;
- travelers.

`Ctrl/Cmd + K` focuses search. Native Web Share is used where available with clipboard fallback elsewhere.

## Appearance

`src/theme.ts` persists one of four user-selectable travel themes. `src/themes.css` provides the palette and picker presentation, while `src/app-v2.css` consumes semantic theme variables across the full application.

Theme preference is device-local today and can move into the authenticated user profile later.

## Persistence boundary

`src/storage.ts` validates and persists the versioned local workspace under `wanderline-workspace-v2`. Invalid or blocked storage falls back to the built-in sample workspace rather than crashing the app.

The local adapter is intentionally isolated. The final hosted implementation should replace it with an authenticated repository/data layer without changing the presentation/domain model.

## Firebase / Firestore target architecture

```text
Firebase Authentication
      |
      v
Authenticated user
      |
      +--> Firestore users/{uid}
      +--> trips/{tripId}
              |
              +--> members
              +--> activities / votes
              +--> places
              +--> expenses / split participants
              +--> packing
              +--> notes
              +--> reservations
              +--> history
```

Security rules must verify trip membership for every shared document and enforce Owner-only operations where appropriate. Viewer writes must be rejected server-side/database-side, not merely hidden in React.

Real-time Firestore listeners can then replace local-only updates so one traveler's edits appear for the rest of the group immediately.

## Production host

Vite builds the browser client and TypeScript builds the Express host. The server provides:

- secure default headers;
- no-store API responses;
- health/config endpoints;
- JSON API `404`s;
- immutable caching for hashed client assets;
- fresh SPA HTML;
- graceful process shutdown.

## Tradeoffs

The current build intentionally does not fake real cross-account collaboration. It fully models and demonstrates the collaboration UX locally, but actual invitation delivery, membership acceptance, private shared links, and multi-device live updates wait for Firebase/Firestore.

Google Maps universal links and Open-Meteo provide useful real-world integrations without putting provider credentials between a recruiter and the demo.
