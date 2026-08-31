# Wanderline

**Make the trip feel real before you leave.** Wanderline is a consumer-focused travel planning application for building day-by-day itineraries, tracking budgets, saving places, managing practical trip details, and presenting the experience with a calmer visual language than a typical admin dashboard.

**Live demo:** https://wanderline-s1yv.onrender.com

## What works today

- Immersive Barcelona trip dashboard with live trip countdown and progress
- Day-by-day itinerary with persistent completion state
- Activity creation and editing with time, type, place, estimated cost, duration, and notes
- Activity deletion and chronological sorting within each day
- Context-aware itinerary search across title, place, note, and activity type
- Budget ledger with safe percentage math, category breakdowns, expense creation, search, and deletion
- Packing checklist with persistent completion state
- Full saved-place workflow: create, search, view details, open in OpenStreetMap, and remove
- Saved-place counts update throughout the interface
- Live Barcelona weather from the keyless Open-Meteo API with a graceful built-in fallback
- Clickable map experience that opens Barcelona in OpenStreetMap without requiring a vendor API key
- Native Web Share support with clipboard fallback
- One-click sample-trip reset
- Branded runtime error recovery instead of blank-screen failure
- Google sign-in hook when Firebase configuration is present
- Credential-free local-first mode when Firebase is absent
- Fully responsive desktop, tablet, and phone presentation with off-canvas mobile navigation and reformatted itinerary/budget/place layouts
- Installable web-app metadata, canonical production metadata, reduced-motion support, and visible keyboard-focus safeguards
- Express production host with health/config endpoints, security headers, caching policy, API 404 handling, and graceful shutdown
- Render auto-deploy from `main` with `/api/health` health checks
- GitHub Actions and Render builds gated on the same full verification command

## Stack

**Frontend:** React 19, TypeScript, Vite, Lucide, custom responsive CSS  
**Auth:** Firebase Authentication (optional final integration)  
**Weather:** Open-Meteo  
**Maps:** OpenStreetMap  
**Persistence:** local-first trip workspace  
**Hosting:** Express 5 + Render  
**Quality:** strict TypeScript, GitHub Actions, pinned dependency versions

## Local development

Requires Node `22.16+`.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The complete visible product works without external credentials and persists itinerary, budget, packing, and saved-place changes in `localStorage`.

Full preflight:

```bash
npm run check
npm run smoke:server
```

`npm run check` typechecks both targets, builds client/server, and verifies the required production artifacts. `npm run smoke:server` boots the compiled Express app and verifies its health/API behavior.

## Optional Firebase authentication

Copy `.env.example` to `.env` and provide credentials when you are ready to enable user identity:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Enable Google as a sign-in provider in Firebase Authentication. No Maps or Weather API keys are required for the current application.

## Persistence boundary

Itinerary items, expenses, packing state, and saved places are currently local-first so the product is immediately reviewable without account setup. Authentication is isolated in `src/firebase.ts`, while the Express host remains independent from browser state.

For private user accounts and cross-device trip data, the remaining production integration is Firebase Authentication plus a hosted datastore such as Firestore keyed to the authenticated user. The current live demo intentionally keeps each browser’s trip changes self-contained.

The server exposes:

- `GET /api/health` — service health and local-first/auth-ready mode
- `GET /api/config` — non-secret Firebase, Open-Meteo, and OpenStreetMap integration information

## Engineering docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — client domain, sharing, auth, provider boundaries, persistence, and production data model
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local/Render/Firebase deployment runbook and production migration path
- [`docs/QA.md`](docs/QA.md) — itinerary, budget, sharing, auth, integration, mobile, API, and accessibility acceptance checklist
- [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) — quick map of the files that own trip UI, persistence, auth, hosting, and deployment

## Deployment

The production Render service tracks `main` with Auto-Deploy enabled. Each commit follows:

```text
GitHub main → npm install → npm run check → Express host → /api/health → live
```

CI uses the same `npm run check` contract, keeping local, CI, and Render verification aligned.

## Portfolio intent

Wanderline is designed to show consumer-product engineering rather than another CRUD dashboard: visual hierarchy, mobile responsiveness, time-sensitive UI, editable persistent state, budget calculations, browser platform APIs, third-party data consumption without secret leakage, auth boundaries, and deployment-ready full-stack structure all live in one cohesive product.
