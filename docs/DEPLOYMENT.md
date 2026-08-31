# Wanderline Deployment Runbook

## 1. Preflight

Use Node `22.16.0` (the repo includes `.nvmrc`). From the repository root:

```bash
npm install
npm run check
npm run smoke:server
```

`npm run check` typechecks both TypeScript targets, builds the Vite client and Express server, and verifies the required production artifacts. `npm run smoke:server` boots the compiled host on a temporary port, validates `/api/health` and `/api/config`, confirms unknown API paths return JSON `404`, and shuts the process down.

For manual production-host inspection:

```bash
npm start
```

## 2. External services

The finalized application does **not** require Maps or Weather API keys:

- current Barcelona weather is read from the public Open-Meteo API with a graceful local fallback;
- map actions open OpenStreetMap in a new tab;
- the rest of the trip experience is local-first and works without credentials.

The only optional external setup left is Firebase Authentication.

## 3. Firebase Auth

Create a Firebase project and web application, enable Google sign-in, and set:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

After the public Render URL exists, add its hostname to Firebase Authentication authorized domains.

If Firebase is not configured, the app stays fully usable with the built-in local demo identity.

## 4. Render

The production service is already deployed at:

```text
https://wanderline-s1yv.onrender.com
```

The included `render.yaml` defines one Node web service with Auto-Deploy-compatible configuration.

Expected commands:

```text
Build: npm install --include=dev --no-audit --no-fund && npm run check
Start: npm start
Health: /api/health
```

Only the optional `VITE_FIREBASE_*` values need to be supplied when Firebase is enabled.

## 5. Release checks

Verify:

1. itinerary renders correctly on desktop, tablet, and mobile;
2. trip countdown is based on the current date;
3. itinerary search filters activities correctly;
4. activities can be created, edited, deleted, completed, and reopened;
5. activity time/type/place/cost/duration/note persist after refresh;
6. budget totals/category percentages stay correct after adding and deleting expenses;
7. expense search filters the ledger without changing aggregate totals;
8. packing state persists after refresh;
9. saved places can be created, searched, opened, mapped, and removed;
10. OpenStreetMap opens from both trip-map and saved-place actions;
11. live Open-Meteo weather loads when reachable and fallback weather keeps the UI usable when not;
12. Web Share works where supported and clipboard fallback works elsewhere;
13. Google sign-in works after Firebase configuration;
14. `/api/health` and `/api/config` return expected JSON;
15. unknown `/api/*` routes return JSON `404` responses;
16. browser console has no uncaught errors.

## 6. Hosted per-user persistence phase

Firebase Authentication by itself provides identity, but it does not move browser-local trip data between devices. For real private user accounts, add Firestore or another hosted datastore keyed to the authenticated user.

A hosted model should cover trips, members, activities, expenses, saved places, and packing items. Keep the UI-facing data shape independent from the persistence provider so the local-first demo can remain a useful fallback.

## 7. After deployment

- keep the live URL in the GitHub README and repository homepage;
- capture desktop and physical-phone screenshots;
- test Web Share on a physical phone and clipboard fallback on desktop;
- test from a clean/incognito browser with no existing local storage;
- add the live project to the portfolio and LinkedIn.

## Rollback

If a release regresses, use Render's previous successful deploy. Auto-Deploy tracks `main`, and the build gate prevents a failing TypeScript/build check from replacing the current live release.
