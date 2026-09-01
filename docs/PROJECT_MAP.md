# Wanderline Project Map

```text
.
├── src/
│   ├── App.tsx                 Tiny compatibility entry that re-exports app/App
│   ├── app/
│   │   ├── App.tsx             Workspace orchestration, navigation, search, permission gates, sharing
│   │   ├── views.tsx           Overview, itinerary, ideas, places, budget, packing, notes, travelers, activity
│   │   ├── forms.tsx           Validated domain mutation forms and trip/member workflows
│   │   └── shared.tsx          Accessible modal and reusable UI primitives
│   ├── model.ts                Canonical domain types, dates, cents math, permissions, invariants
│   ├── demo.ts                 Barcelona sample workspace (schema v4)
│   ├── storage.ts              Deep validation, v4 persistence, v3 migration/normalization
│   ├── maps.ts                 Blank-safe Google Maps universal URLs
│   ├── weather.ts              Open-Meteo geocoding, disambiguation, aborts, cache
│   ├── firebase.ts             Optional Firebase Google Authentication adapter only
│   ├── theme.ts                Persisted four-theme picker with focus management
│   ├── themes.css              Theme palettes + picker presentation
│   ├── app-v2.css              Core responsive/themed product visuals
│   ├── accessibility.css       Global focus/reduced-motion baseline
│   ├── polish.css              Final readability, touch, safe-area, narrow-screen layer
│   ├── ErrorBoundary.tsx       Runtime recovery + v4/v3 local-workspace reset
│   └── main.tsx                React entry and stylesheet ordering
├── tests/
│   └── domain.test.ts          Date/money/member/persistence/Maps domain tests
├── server/
│   └── index.ts                Express host + truthful local/auth/persistence metadata
├── scripts/
│   ├── verify-build.mjs        Required production-artifact verifier
│   └── smoke-server.mjs        Compiled-server contract smoke test
├── docs/
│   ├── ARCHITECTURE.md         Domain/invariant/cloud-boundary design
│   ├── DEPLOYMENT.md           Render + Firebase/Firestore rollout runbook
│   ├── QA.md                   Automated/manual acceptance checklist
│   └── PROJECT_MAP.md          This file
├── .github/workflows/ci.yml
├── render.yaml
├── tsconfig.test.json
└── package.json
```

## Where to make common changes

| Goal | Primary files |
| --- | --- |
| Change trip/member/activity/expense types or pure domain calculations | `src/model.ts` |
| Change schema validation/migration/local persistence | `src/storage.ts`, `src/demo.ts` |
| Change global app state/navigation/search/sharing/permission orchestration | `src/app/App.tsx` |
| Change a product view | `src/app/views.tsx` |
| Change add/edit forms or mutation validation | `src/app/forms.tsx` |
| Change modal/focus/shared UI primitives | `src/app/shared.tsx` |
| Change Google Maps behavior | `src/maps.ts` |
| Change weather behavior | `src/weather.ts` |
| Change Firebase Authentication | `src/firebase.ts` |
| Add real Firestore collaboration | new repository/data adapter + Firebase setup/rules; then update `storage.ts` boundary/API metadata |
| Change appearance themes | `src/theme.ts`, `src/themes.css` |
| Change primary layout visuals | `src/app-v2.css` |
| Change final mobile/readability/accessibility overrides | `src/polish.css`, `src/accessibility.css` |
| Change runtime recovery | `src/ErrorBoundary.tsx` |
| Change production health/config truth | `server/index.ts`, `scripts/smoke-server.mjs` |
| Change automated domain coverage | `tests/domain.test.ts`, `tsconfig.test.json` |
| Change CI/build gates | `package.json`, `.github/workflows/ci.yml`, `scripts/*` |

## Important boundaries

### Local demo today

The browser-local product supports:

- trips;
- roles/statuses;
- locally pending invitations;
- ideas/voting;
- itinerary;
- saved places;
- expenses/splits/settlements;
- packing;
- notes/bookings;
- history;
- weather/Maps handoff;
- Share summary.

### Requires Firestore / hosted collaboration

These are intentionally **not** represented as complete today:

- invitation delivery/acceptance;
- authenticated private trip membership;
- cross-device storage;
- realtime multi-user synchronization;
- database-enforced Owner/Editor/Viewer writes;
- real private invitation/join URLs;
- conflict/concurrency behavior across simultaneous editors.

### Authentication is not persistence

`src/firebase.ts` can enable Google Authentication when environment variables exist. That does not change `persistence: browser-local`, `firestore: false`, or `collaboration: local-demo` until a real hosted data layer is implemented.

## Verification

```bash
npm run check
npm run smoke:server
```

`npm run check` includes strict TypeScript, the pure domain suite, client/server builds, and build-artifact verification. Manual QA then covers browser interaction, provider failure, mobile layouts, touch, focus, and Web Share behavior.
