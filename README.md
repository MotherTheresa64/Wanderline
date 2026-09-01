# Wanderline

**Plan together. Travel lighter.** Wanderline is a local-first travel-planning workspace for solo and group trips. It takes a trip from early ideas through itinerary, travelers, saved places, actual expenses, packing, bookings, notes, weather, and the journey itself.

**Live demo:** https://wanderline-s1yv.onrender.com

> **Cloud status:** the current public build is a complete browser-local product demo. Owner/Editor/Viewer roles, pending invitations, voting, and group workflows are modeled and enforced in the client, but they do **not** synchronize between users or devices yet. Firebase Authentication is scaffolded; Firestore persistence, invitation delivery, authenticated membership, and realtime collaboration remain an explicit hosted-data phase.

## Product capabilities

### Trips and dates

- Create and switch between multiple trips.
- Edit destination, description, dates, and USD budget.
- Archive/delete trips while preserving a usable active-trip invariant.
- Date-only helpers intentionally avoid local-timezone shifts for itinerary days.
- Changing a trip's date range reconciles existing activities and reservations onto the nearest valid trip day instead of orphaning them.
- Day tabs and itinerary ordering derive from canonical trip/activity state.

### Ideas → itinerary

- Suggestions live in **Ideas**, not as duplicate itinerary objects.
- Active travelers can vote/unvote.
- Editors can promote an idea to Planned or Confirmed.
- Activities use one shared model across Suggested, Planned, Confirmed, and Completed states.
- Attendees, creator, location, date/time, duration, notes, category, and estimated cost stay attached to that single canonical activity.

### Travelers and roles

- **Owner:** trip settings, member management, destructive trip actions, full editing.
- **Editor:** itinerary, ideas, saved places, expenses, packing, notes, and bookings.
- **Viewer:** read-only planning access; active viewers may still vote on ideas.
- Pending and removed travelers cannot mutate trip resources.
- Removing a traveler does not silently corrupt financial or responsibility data: removal is blocked until referenced expenses/shared packing are reassigned or removed.
- Former active travelers are retained as lightweight tombstones so historical authorship/activity logs remain understandable while live attendee/vote references are cleaned up.

### Cent-accurate shared expenses

Wanderline treats money as a domain concern rather than presentation math.

- Actual expenses are separate from itinerary estimated costs, so budget totals do not double-count planning estimates.
- **Personal:** the responsible traveler is explicit and may differ from the person who paid.
- **Equal:** amounts are converted to integer cents and remainder cents are distributed deterministically. `$10.00 / 3` becomes `$3.34 + $3.33 + $3.33`, never a hidden `$9.99` total.
- **Custom:** every share must be nonnegative and the selected shares must equal the expense total exactly to the cent.
- Paid/share/balance values derive from canonical expenses.
- Settlement suggestions operate in integer cents and terminate without floating-point residuals.

### Saved places and Google Maps

- Add, edit, search, and remove saved places.
- Store category, neighborhood, notes, and author.
- Convert a saved place into a prefilled itinerary activity without deleting the saved place.
- Google Maps search and walking-direction handoffs use encoded universal URLs, so current map features require no paid Maps SDK or API key.

### Weather

- Destination-aware current conditions use Open-Meteo.
- Geocoding considers multiple candidates and scores them against the full destination rather than blindly taking the first city-name match.
- Successful weather results are cached briefly.
- Aborted, slow, failed, or empty provider responses degrade to “Weather unavailable” and never block trip planning.

### Packing, notes, and bookings

- Personal and shared packing items with explicit responsibility and completion progress.
- Duplicate identical packing assignments are prevented in the add flow.
- Shared notes preserve author/update semantics.
- Reservations support type, date, time, location, confirmation/reference, and notes.
- Booking dates stay within the trip date range.
- Confirmation/reference values are intentionally excluded from Share summary output.

### Search, sharing, themes, and recovery

- Global search spans activities, places, expenses, notes, bookings, and travelers.
- `Ctrl/Cmd + K` focuses search.
- **Share summary** uses Web Share where available with clipboard fallback; it shares non-sensitive trip summary text only and does not pretend the current page URL is an invitation/join link.
- Four persisted dark travel themes: Sunset, Coast, Terracotta, and Night train.
- Theme picker traps/restores keyboard focus and supports Escape.
- Branded error recovery can reload or clear only Wanderline workspace data.

## Responsive and accessibility behavior

The UI is designed as a consumer travel app rather than a desktop dashboard squeezed onto a phone.

- Off-canvas phone navigation with backdrop.
- Horizontal day navigation on narrow screens.
- Mobile expense/traveler rows reflow instead of overflowing.
- One-column cards for ideas, places, packing, and notes at phone widths.
- Scrollable small-screen modals with safe-area padding.
- Functional mobile controls target touch-friendly sizing.
- Visible keyboard focus, dialog focus trapping/restoration, form labels/errors, live status/error feedback, semantic progress values, and reduced-motion support.
- Responsive QA targets include 360px phone portrait, ordinary phone, phone landscape, tablet, laptop, and desktop.

## Stack

**Frontend:** React 19, TypeScript, Vite, Lucide, custom responsive/themed CSS  
**Current persistence:** validated/versioned browser-local workspace (`wanderline-workspace-v4`)  
**Migration:** valid v3 workspaces are normalized and migrated automatically  
**Authentication boundary:** Firebase Authentication / Google sign-in scaffold  
**Realtime collaboration boundary:** Firestore — not implemented yet  
**Weather:** Open-Meteo  
**Maps:** Google Maps universal URLs  
**Currency:** USD, cent-based domain calculations  
**Production host:** Express 5 + Render  
**Quality:** strict TypeScript, Node test runner via `tsx`, GitHub Actions, production artifact verification, server smoke testing

## Local development

Use Node `22.16.0` (see `.nvmrc`).

```bash
npm install
npm run dev
```

No external credential is required to review the complete local product demo.

Full verification:

```bash
npm run check
npm run smoke:server
```

`npm run check` now runs:

1. React/client TypeScript checks;
2. Express/server TypeScript checks;
3. domain-test TypeScript checks;
4. focused automated domain tests;
5. Vite + Express production builds;
6. required artifact verification.

The automated domain suite covers date-only behavior, invalid ranges, equal/custom/personal expense semantics, exact-cent balances/settlements, trip-date reconciliation, permissions, owner/member-removal invariants, v3→v4 persistence migration, malformed local data, active-trip recovery, and Maps encoding.

## Production API

The tiny Express host is intentionally not a fake collaboration backend.

- `GET /api/health` — service status plus `mode: local-first`, authentication readiness, and `persistence: browser-local`.
- `GET /api/config` — non-secret integration facts including `firestore: false`, `collaboration: local-demo`, weather/maps/currency, and Firebase Authentication configuration status.
- unknown `/api/*` — JSON `404`.

## Firebase / Firestore next phase

The repository includes the Firebase web-config seam:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Configuring those values enables the existing Google Authentication client, but **authentication alone does not make Wanderline collaborative**.

To complete real hosted collaboration:

1. Create/choose a Firebase project and web app.
2. Enable Google Authentication and authorize the deployed hostname.
3. Add Firestore.
4. Persist trip resources with real ownership boundaries: trips, membership/invitations, activities/votes, places, expenses/splits, packing, notes, reservations, and history.
5. Add authenticated realtime listeners and repository/data adapters behind the current persistence seam.
6. Enforce membership and Owner/Editor/Viewer writes in Firestore Security Rules; never rely on React `canEdit` for security.
7. Implement actual invitation acceptance and private trip-link resolution.
8. Add concurrency/conflict handling where simultaneous edits can occur.
9. Only then change UI/metadata/API status from local demo to realtime collaboration.

## Engineering docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — domain boundaries, invariants, money/date design, local/cloud boundary.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — verification, Render, and Firebase/Firestore rollout.
- [`docs/QA.md`](docs/QA.md) — functional, failure, responsive, accessibility, and production acceptance checks.
- [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) — source ownership and where to make common changes.

## Portfolio intent

Wanderline is intentionally not a collection of technologies added for resume keywords. Its engineering story is travel-domain correctness: date-only modeling, role-aware state transitions, cent-accurate group expense logic, reference-safe member removal, resilient third-party integrations, versioned persistence, responsive consumer UX, accessibility, testable pure helpers, CI, and an honest migration path from a credential-free public demo to authenticated realtime collaboration.
