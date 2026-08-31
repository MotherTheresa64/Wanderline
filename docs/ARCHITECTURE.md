# Wanderline Architecture

## Goals

Wanderline is a consumer travel-planning product designed around a calm, visual itinerary rather than an admin-style dashboard. The current build is fully demonstrable without private third-party credentials while keeping authentication and hosted persistence behind explicit integration seams.

## Runtime shape

```text
Browser
  React 19 + TypeScript
      |
      +-- itinerary / budget / packing / saved-place state
      +-- localStorage persistence
      +-- firebase.ts -> optional Google authentication
      +-- Open-Meteo -> current Barcelona weather (keyless)
      +-- OpenStreetMap -> external map/search actions
      +-- Web Share / clipboard fallback
      |
Express production host
      +-- /api/health
      +-- /api/config
      +-- static Vite build / SPA fallback
```

## Client domain

The main client state covers four practical travel concerns:

- activities: ordered day/time plans with place, type, cost, duration, completion, and notes;
- expenses: categorized trip spending used to derive budget metrics;
- packing: lightweight completion state for trip preparation;
- saved places: user-created points of interest with category, neighborhood, notes, and map actions.

Derived values such as budget remaining, completion percentage, category totals, packing progress, saved-place counts, and search results are calculated from canonical state instead of independently stored display values.

## Itinerary workflow

Activities can be created, edited, deleted, completed, reopened, searched, and sorted chronologically. Editing preserves completion state. The mobile layout reformats the timeline and controls rather than forcing desktop-width content into a narrow viewport.

## Budget workflow

Expenses can be created, searched, and removed. Aggregate budget and category figures always derive from the complete ledger, while search only changes which ledger rows are visible.

## Saved places

Saved places are first-class persisted data rather than static cards. Users can create, search, inspect, map, and remove them. OpenStreetMap is opened externally with URL-encoded place queries, which avoids exposing or managing a private maps credential.

## Weather

The client reads current Barcelona conditions from Open-Meteo's public forecast API. Weather is intentionally non-critical: if the request fails, Wanderline retains a polished fallback condition so the trip-planning workflow stays usable offline or during provider disruption.

## Search and sharing

The global search field is contextual to the selected tab:

- itinerary -> activity title/place/note/type;
- budget -> expense label/category;
- saved -> place name/category/neighborhood/note.

Sharing uses the platform Web Share API when available and falls back to the clipboard, providing useful behavior on both mobile and desktop without another service.

## Authentication

`src/firebase.ts` activates only when the required `VITE_FIREBASE_*` variables exist. The portfolio release therefore has no credential requirement while a real Google sign-in flow can be enabled without replacing the application shell.

Firebase Authentication provides identity only. Cross-device private trip data requires a hosted datastore such as Firestore keyed to the authenticated user.

## Persistence

The current experience persists trip state locally so reviewers can fully modify the itinerary, expenses, packing list, and saved places without creating an account. Storage failures are caught so the in-memory application remains usable even if persistence is unavailable.

Hosted storage can later replace the local adapter with user-owned trips, collaborators, activities, expenses, saved places, and packing items.

## Deployment

Vite builds the browser client and TypeScript builds the Node host. The Express layer provides health/config endpoints, secure default headers, correct JSON API 404s, immutable caching for hashed assets, fresh HTML responses, and graceful process shutdown on Render deploys.

Render tracks `main` with Auto-Deploy. `npm run check` must pass before a new release can become live.

## Production data model

A practical hosted schema would include users, trips, trip_members, activities, expenses, saved_places, packing_items, and optional reservations/attachments. Activity ordering should use explicit sortable positions or timestamps rather than relying on insertion order.

## Tradeoffs

Open-Meteo and OpenStreetMap were chosen for the current portfolio release because they provide useful real-world data/navigation without requiring secret management or quota setup. Authentication and cross-device persistence remain intentionally isolated so Firebase can be added as the final external integration without rewriting the consumer-facing product.
