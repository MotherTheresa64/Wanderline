# Wanderline Deployment Runbook

## 1. Preflight

Use Node `22.16.0` (the repo includes `.nvmrc`). From the repository root:

```bash
npm install
npm run check
npm run smoke:server
```

`npm run check` typechecks the React and Node targets, builds both production artifacts, and verifies the generated client/server output. `npm run smoke:server` starts the compiled Express host on a temporary port, validates `/api/health` and `/api/config`, confirms unknown API routes return JSON `404`, and shuts down cleanly.

## 2. Current external services

The public app requires no Maps or Weather secret:

- destination weather uses Open-Meteo's public geocoding + forecast APIs;
- map/search/directions actions use Google Maps universal URLs;
- USD formatting uses the browser `Intl` APIs;
- collaborative state currently uses validated local browser persistence.

The only remaining external product phase is Firebase Authentication + hosted collaborative storage.

## 3. Firebase Authentication

Create a Firebase project and web application, enable Google sign-in, and set:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

Add the Render hostname to Firebase Authentication authorized domains.

Without these values, Wanderline deliberately stays in local demo mode instead of blocking the public portfolio experience.

## 4. Firestore collaboration phase

Authentication alone does not make trips shared. Add Firestore (or an equivalent hosted datastore) for:

- user profiles;
- trips;
- trip membership, roles, and invitations;
- activities, statuses, attendees, and votes;
- saved places;
- expenses, payers, participants, and custom shares;
- packing items and ownership;
- notes;
- reservations;
- activity history.

Use real-time listeners for shared trip resources so changes appear across collaborators/devices without manual refresh.

Firestore rules must enforce:

- authenticated membership for private trip reads;
- Owner-only membership/permission/destructive trip operations;
- Editor writes to allowed shared planning resources;
- Viewer read-only access;
- user-owned profile preference writes.

## 5. Render

Production URL:

```text
https://wanderline-s1yv.onrender.com
```

Expected service configuration:

```text
Branch: main
Build: npm install --include=dev --no-audit --no-fund && npm run check
Start: npm start
Health: /api/health
Auto-Deploy: On Commit
```

`render.yaml` contains the Firebase environment placeholders. No Google Maps or Open-Meteo key is required for the current integration strategy.

## 6. Release checks

Before considering a commit production-ready, verify:

1. CI `npm run check` succeeds;
2. compiled server smoke test succeeds;
3. Overview displays active trip, party, budget, bookings, and group decisions;
4. multiple trips can be created and switched;
5. trip details can be edited;
6. archiving/deleting a trip switches to a valid fallback trip;
7. itinerary contains one non-overlapping chronological card per activity;
8. activity CRUD/status/attendee changes persist;
9. Ideas can be voted on and promoted to Planned/Confirmed;
10. saved places can be searched, edited, removed, mapped, and converted into itinerary items;
11. Google Maps search/directions open correctly on desktop and mobile;
12. budget totals remain USD and agree with the full expense ledger;
13. personal/equal/custom expense splits calculate correctly;
14. settlement suggestions match member balances;
15. shared/personal packing ownership behaves correctly;
16. notes/bookings CRUD works and booking locations open Google Maps;
17. traveler roles and pending invitations behave correctly in local mode;
18. global search routes results into the correct product view;
19. destination weather loads when Open-Meteo is reachable and fails gracefully otherwise;
20. theme selection persists;
21. native Web Share / clipboard fallback behave correctly;
22. error recovery clears only Wanderline v2 workspace data;
23. `/api/health` and `/api/config` return expected JSON;
24. unknown `/api/*` returns JSON `404`;
25. no uncaught browser errors appear during the primary workflows.

## 7. Mobile/device checks

Test at minimum:

- 360x800
- 390x844
- 844x390 landscape
- 768x1024 tablet
- 1366x768 laptop
- 1920x1080 desktop
- one physical Android or iOS device

The itinerary must reflow without duplicate cards, overlap, or page-level horizontal scrolling. Modals must remain scrollable and controls must remain large enough to operate by touch.

## 8. Rollback

Render Auto-Deploy tracks `main`. If a production regression escapes CI, restore the previous successful deploy through Render or revert the responsible commit on `main`.

The GitHub Actions build/smoke gates are intended to catch TypeScript, production build, and server-contract failures before release.
