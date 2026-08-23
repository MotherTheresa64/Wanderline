# Wanderline

**Make the trip feel real before you leave.** Wanderline is a visual travel-planning application for building day-by-day itineraries, tracking trip budgets, saving places, and keeping the practical details of a trip in one calm workspace.

## Product highlights

- Immersive trip dashboard with itinerary timeline, map-style place overview, weather, and trip progress
- Day-by-day planning with interactive completion state and activity creation
- Budget ledger with category breakdowns and new-expense workflow
- Saved places and practical trip notes in a unified side panel
- Packing checklist with durable local state
- Responsive mobile experience designed to feel like a consumer travel app rather than an admin dashboard
- Credential-free demo mode plus environment hooks for weather/maps/Firebase services
- Render-ready Express host, health/config endpoints, and GitHub Actions build validation

## Stack

React 19 · TypeScript · Vite · Express · Firebase-ready auth · Lucide · responsive custom CSS

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Everything visible in the demo works without an API key and persists in your browser.

## Optional integrations

Copy `.env.example` to `.env` and add provider credentials when you are ready. The app is deliberately structured so external maps/weather/auth services can replace demo data without changing the page architecture.

## Production

```bash
npm install
npm run build
npm start
```

`render.yaml` can deploy Wanderline as a single Node web service.
