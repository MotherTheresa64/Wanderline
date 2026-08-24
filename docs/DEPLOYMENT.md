# Wanderline Deployment Runbook

## 1. Preflight

Use Node `22.16.0` (the repo includes `.nvmrc`). From the repository root:

```bash
npm install
npm run typecheck
npm run build
```

A successful build should produce:

- `dist/index.html`
- `dist/assets/*`
- `dist-server/index.js`

Run the compiled application:

```bash
npm start
```

Confirm `/api/health` returns JSON with `status: "ok"`.

## 2. Firebase Auth

Create a Firebase project and web application, enable Google sign-in, and set:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

After the public Render URL exists, add its hostname to Firebase Authentication authorized domains.

## 3. Maps and weather providers

The current demo does not require provider credentials. When real integrations are enabled, set server-side provider secrets:

```text
MAPS_API_KEY
WEATHER_API_KEY
```

Do not expose unrestricted provider secrets through `VITE_*` variables. Prefer small server endpoints that call the provider and return normalized Wanderline data.

## 4. Render

Create a Blueprint from this repository. The included `render.yaml` defines one Node web service.

Expected commands:

```text
Build: npm install --include=dev && npm run build
Start: npm start
Health: /api/health
```

Enter all `sync: false` values through Render rather than committing secrets.

## 5. First-deploy checks

Verify:

1. the itinerary renders correctly on desktop and mobile;
2. trip countdown is based on the current date;
3. itinerary search filters activities correctly;
4. adding an activity persists its time, type, place, cost, and note;
5. activity completion persists after refresh;
6. budget totals/category percentages stay correct after new expenses;
7. packing changes persist after refresh;
8. Share uses native Web Share where available and clipboard fallback elsewhere;
9. Google sign-in works after Firebase configuration;
10. `/api/health` and `/api/config` return expected JSON;
11. unknown `/api/*` routes return JSON `404` responses;
12. browser console has no uncaught errors.

## 6. Hosted persistence phase

Introduce authenticated trip ownership and collaboration through API resources for trips, members, activities, expenses, saved places, and packing items. Keep external maps/weather provider calls behind the API so vendor-specific schemas and secrets remain outside presentation components.

## 7. After deployment

Once the URL is stable:

- add it to the GitHub repository homepage field;
- add the live URL/screenshots to the README;
- create a strong social preview image;
- add the project to the portfolio and LinkedIn;
- test Web Share on a physical phone and clipboard fallback on desktop;
- test the site from a clean/incognito browser with no existing local storage.

## Rollback

Use Render's previous successful deploy if a release regresses. Wanderline should retain a functional local/demo experience even when Firebase, maps, or weather providers are absent.
