# Wanderline

**Plan together. Travel lighter.** Wanderline is a collaborative travel workspace for planning solo or group trips from the first saved idea through the actual journey. It combines itinerary planning, group decisions, travelers and permissions, saved places, shared expenses, packing, bookings, practical notes, weather, Google Maps actions, and trip history in one responsive consumer product.

**Live demo:** https://wanderline-s1yv.onrender.com

## What works today

### Trips and collaboration

- Create and switch between multiple trips
- Edit trip name, destination, dates, description, and USD budget
- Archive or permanently delete trips
- Solo trips work without collaboration clutter
- Add pending traveler invitations in the credential-free demo
- Owner, Editor, and Viewer roles are modeled and enforced in the UI
- Owners can change member roles or remove travelers
- Shared activity history records meaningful trip changes
- The local data model already matches the Firebase/Firestore collaboration boundary planned for the authenticated release

### Collaborative planning

- Dedicated **Ideas** workspace keeps suggestions out of the confirmed itinerary
- Travelers can vote on suggested activities
- Editors can promote ideas to Planned or Confirmed
- Activities support Suggested, Planned, Confirmed, and Completed states
- Each plan records who added it and which travelers are attending

### Day-by-day itinerary

- One clean chronological timeline with **one card per activity** — no duplicate floating itinerary cards
- Day tabs derived from the trip's real start/end dates
- Add, edit, delete, complete, and reopen activities
- Time, place, category, duration, notes, attendees, and USD estimated cost
- Chronological sorting within each day
- Direct Google Maps place lookup and walking directions from itinerary items
- Responsive timeline that reformats for narrow phones rather than overlapping or requiring desktop-width content

### Saved places

- Add, edit, search, and remove saved places
- Store category, neighborhood, notes, and who saved the place
- Open a place in Google Maps
- Convert a saved place directly into a prefilled itinerary activity

### Budget and shared expenses

- USD-first presentation throughout the product
- Overall budget, spent amount, remaining balance, and usage percentage
- Add, edit, search, categorize, and delete expenses
- Track who paid
- Personal, equal, and custom split modes
- Choose which travelers participate in an expense
- Custom-share validation ensures entered splits match the expense total
- Derived per-traveler paid/share/balance figures
- Settlement suggestions such as who owes whom and how much

### Packing

- Personal and shared packing items
- Assign responsibility for shared gear to a traveler
- Completion tracking and preparation progress
- Add, complete/reopen, and remove packing items

### Notes and bookings

- Shared trip notes with author and update time
- Add, edit, and delete notes
- Store flights, hotels, rental cars, restaurants, events, and other reservations
- Dates, times, locations, confirmation/reference numbers, and practical notes
- Open booking locations in Google Maps

### Search, weather, sharing, and personalization

- Global search across activities, places, expenses, notes, bookings, and travelers
- `Ctrl/Cmd + K` keyboard shortcut to focus trip search
- Destination-aware current weather using the keyless Open-Meteo geocoding + forecast APIs
- Native Web Share with clipboard fallback
- Google Maps universal search/directions links — no Google Maps API key or billing setup required for current map actions
- Four persisted themes: **Sunset, Coast, Terracotta, and Night train**
- Browser theme-color follows the selected appearance
- Branded runtime recovery and one-click sample-workspace reset

### Mobile and production behavior

- Desktop, laptop, tablet, phone portrait, phone landscape, and narrow ~360px layouts
- Off-canvas phone navigation with backdrop
- Forms and modals remain scrollable inside small viewports
- Touch-friendly controls and visible keyboard focus
- Reduced-motion support
- Local workspace persistence with defensive recovery when browser storage is malformed or unavailable
- Express production host with health/config endpoints, secure headers, API 404 handling, caching policy, and SPA fallback
- GitHub Actions runs `npm run check` plus the compiled-server smoke test
- Render tracks `main` with Auto-Deploy

## Stack

**Frontend:** React 19, TypeScript, Vite, Lucide, custom responsive/themed CSS  
**Auth boundary:** Firebase Authentication (Google sign-in scaffolded; final integration pending)  
**Hosted collaboration boundary:** Firestore or equivalent (final integration pending)  
**Weather:** Open-Meteo  
**Maps:** Google Maps universal links  
**Currency:** USD  
**Current persistence:** typed/versioned local-first collaborative workspace  
**Hosting:** Express 5 + Render  
**Quality:** strict TypeScript, GitHub Actions, production smoke testing, pinned dependencies

## Local development

Requires Node `22.16+`.

```bash
npm install
npm run dev
```

The app is fully reviewable without credentials. The Barcelona sample workspace and all local edits are stored under the versioned `wanderline-workspace-v2` browser key. Appearance is persisted separately.

Full verification:

```bash
npm run check
npm run smoke:server
```

`npm run check` typechecks both TypeScript targets, builds the Vite client and Express host, and verifies production artifacts. `npm run smoke:server` starts the compiled server on a temporary port and validates its API contract.

## Firebase / Firestore final integration

The UI and domain model are intentionally complete before cloud wiring. Firebase Authentication should provide identity, while Firestore should replace the local storage adapter for actual cross-device/shared trips.

Configure the existing Firebase client seam with:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Enable Google Authentication and authorize the Render hostname.

The hosted data model should persist at minimum:

- users
- trips
- trip members / roles / invitations
- activities and votes
- saved places
- expenses, participants, and custom shares
- packing items
- trip notes
- reservations
- activity history

Firestore security rules must enforce trip membership and owner-only operations. Once cloud persistence is connected, pending local invitations become real invitations, collaborator changes synchronize between devices, and private trip links can resolve against authenticated membership.

## External services

No Maps or Weather secret is required for the current app:

- **Google Maps:** standard universal URLs for place search and directions
- **Open-Meteo:** public geocoding and current-weather endpoints

This keeps the recruiter-facing demo immediately usable without quotas, billing configuration, or exposed provider secrets.

## Production API

- `GET /api/health` — service readiness and local/auth-ready mode
- `GET /api/config` — non-secret integration/currency/collaboration information
- unknown `/api/*` — JSON `404`

## Engineering docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — collaborative domain, local/cloud boundary, roles, expense splitting, maps/weather, and deployment shape
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local/Render/Firebase deployment runbook
- [`docs/QA.md`](docs/QA.md) — functional, collaboration, mobile, map, budget, theme, and production acceptance checks
- [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) — current source ownership map

## Deployment

The production Render service tracks `main` with Auto-Deploy enabled:

```text
GitHub main → npm install → npm run check → Express host → /api/health → live
```

GitHub Actions additionally runs the compiled-server smoke test before a commit is considered clean.

## Portfolio intent

Wanderline demonstrates more than itinerary CRUD. The application models a consumer collaboration problem with multiple resources and permissions: personal/group trips, roles, suggestions and voting, shared financial calculations, responsibility assignment, global search, third-party data, Google Maps handoff, persistent personalization, responsive interaction design, error recovery, CI, and a clean migration path from a credential-free local product to authenticated real-time cloud collaboration.
