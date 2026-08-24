# Wanderline Architecture

## Goals

Wanderline is a consumer travel-planning product designed around a calm, visual itinerary rather than an admin-style dashboard. The current build is fully demonstrable without third-party credentials while keeping maps, weather, authentication, and hosted persistence behind explicit integration seams.

## Runtime shape

```text
Browser
  React 19 + TypeScript
      |
      +-- itinerary / budget / packing state
      +-- localStorage demo persistence
      +-- firebase.ts -> optional Google authentication
      +-- Web Share / clipboard fallback
      |
Express production host
      +-- /api/health
      +-- /api/config
      +-- static Vite build / SPA fallback
```

## Client domain

The main client state is separated into three practical travel concerns:

- activities: ordered day/time plans with place, type, cost, completion, and notes;
- expenses: categorized trip spending used to derive budget metrics;
- packing: lightweight completion state for trip preparation.

Derived values such as budget remaining, completion percentage, category totals, and itinerary search results are calculated from canonical state instead of independently stored display values.

## Search and sharing

Itinerary search filters plans using user-entered terms across relevant activity content. Sharing uses the platform Web Share API when available and falls back to the clipboard, providing useful behavior on both mobile and desktop without an external service.

## Authentication

`src/firebase.ts` activates only when the required `VITE_FIREBASE_*` variables exist. This means the portfolio demo has no credential requirement while a real Google sign-in flow can be enabled later without replacing the application shell.

## External data seams

The server exposes configuration readiness for maps and weather independently of the client demo data. A production implementation should keep provider secrets server-side and expose narrow application endpoints instead of shipping unrestricted provider keys to the browser.

Suggested flows:

```text
Client -> /api/weather?place=... -> Weather provider
Client -> /api/places/search?q=... -> Places/maps provider
```

Provider responses should be normalized into Wanderline-owned types so changing vendors does not require rewriting presentation components.

## Persistence

The current experience persists trip state locally so reviewers can modify the itinerary, budget, and packing list without creating an account. Hosted production storage can replace this with user-owned trips, collaborators, activities, expenses, saved places, and packing items.

## Deployment

Vite builds the browser client and TypeScript builds the Node host. The Express layer provides health/config endpoints, secure default headers, correct JSON API 404s, immutable caching for hashed assets, fresh HTML responses, and graceful process shutdown on Render deploys.

## Production data model

A practical relational schema would include users, trips, trip_members, activities, expenses, saved_places, packing_items, and optional reservations/attachments. Activity ordering should use explicit sortable positions rather than relying on insertion order.

## Tradeoffs

Maps and weather are represented with polished local demo data today so the core product remains useful without API quotas or provider accounts. The important architectural choice is that external-provider concerns are isolated and replaceable rather than embedded throughout the UI.
