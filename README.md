# Wanderline

**Make the trip feel real before you leave.** Wanderline is a consumer-focused travel planning application for building day-by-day itineraries, tracking budgets, keeping practical trip details together, and presenting the experience with a calmer visual language than a typical admin dashboard.

**Live demo:** https://wanderline-s1yv.onrender.com

## What works today

- Immersive Barcelona trip dashboard with live trip countdown and progress
- Day-by-day itinerary with completion state and persistent browser storage
- Search across the active day’s activities, places, notes, and activity type
- Activity creation with time, type, place, estimated cost, and notes
- Budget ledger with safe percentage math, category breakdowns, and expense entry
- Packing checklist with persistent completion state
- Saved-place browsing and local travel tips
- Native Web Share support with clipboard fallback
- Branded runtime error recovery instead of blank-screen failure
- Google sign-in hook when Firebase configuration is present
- Credential-free demo mode when third-party services are absent
- Responsive mobile-first presentation
- Installable web-app metadata and reduced-motion/focus accessibility safeguards
- Express production host with health/config endpoints, security headers, caching policy, and graceful shutdown
- Render Blueprint and GitHub Actions gated on the same full verification command

## Stack

**Frontend:** React 19, TypeScript, Vite, Lucide, custom responsive CSS  
**Auth:** Firebase Authentication (optional)  
**Integration hooks:** maps and weather environment configuration  
**Hosting:** Express 5, Render Blueprint  
**Quality:** strict TypeScript, GitHub Actions, pinned dependency versions

## Local development

Requires Node `22.16+`.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The complete visible demo works without external credentials and persists itinerary, budget, and packing changes in `localStorage`.

Full preflight:

```bash
npm run check
```

That command typechecks both targets, builds client/server, and verifies the required production artifacts. Run `npm start` afterward to test the compiled Express-hosted build.

## Optional integrations

Copy `.env.example` to `.env` and provide credentials as needed.

Firebase client values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Server-side provider placeholders:

```env
MAPS_API_KEY=
WEATHER_API_KEY=
```

The application deliberately degrades to demo data when these services are not configured instead of failing at startup.

## Production boundary

The itinerary, expense ledger, and packing list are currently local-first so the product is immediately reviewable. Authentication is isolated in `src/firebase.ts`, while external provider readiness is exposed through the Express host without leaking secret values. This keeps the UI independent from whichever hosted API/database implementation is connected later.

The server exposes:

- `GET /api/health` — service and provider readiness
- `GET /api/config` — non-secret maps/weather/Firebase readiness flags

## Engineering docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — client domain, sharing, auth, provider boundaries, persistence, and production data model
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local/Render/Firebase/provider deployment runbook and production migration path
- [`docs/QA.md`](docs/QA.md) — itinerary, budget, sharing, auth, integration, mobile, API, and accessibility acceptance checklist

## Deployment

The included `render.yaml` pins Node, installs the build toolchain, defines the required environment placeholders, starts the compiled Express application, and uses `/api/health` for Render health checks.

```text
GitHub repo → npm install → npm run check → Express host → health check
```

CI uses the same `npm run check` contract, keeping local, CI, and Render verification aligned.

## Portfolio intent

Wanderline is designed to show consumer-product engineering rather than another CRUD dashboard: visual hierarchy, mobile responsiveness, time-sensitive UI, persistent state, budget calculations, browser platform APIs, auth/integration boundaries, and deployment-ready full-stack structure all live in one cohesive product.
