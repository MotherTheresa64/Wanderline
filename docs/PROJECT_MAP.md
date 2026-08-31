# Wanderline Project Map

```text
.
├── src/
│   ├── App.tsx             Itinerary, budget, packing, saved places, weather, maps, sharing, search
│   ├── firebase.ts         Optional Firebase Google-auth adapter
│   ├── ErrorBoundary.tsx   Runtime recovery and local-data reset path
│   ├── styles.css          Core visual system
│   ├── final-polish.css    Responsive/mobile and final product overrides
│   └── accessibility.css   Focus visibility and reduced-motion rules
├── server/
│   └── index.ts            Express production host and non-secret config/health endpoints
├── scripts/
│   ├── verify-build.mjs    Required production-artifact verifier
│   └── smoke-server.mjs    Compiled-server integration smoke test
├── docs/
│   ├── ARCHITECTURE.md     Travel-domain/integration architecture
│   ├── DEPLOYMENT.md       Render/Firebase deployment runbook
│   ├── QA.md               Functional/mobile/integration acceptance checklist
│   └── PROJECT_MAP.md      This file
├── .github/workflows/ci.yml
├── render.yaml
└── package.json
```

## Where to make common changes

| Goal | Primary files |
| --- | --- |
| Change itinerary/budget/packing/saved-place behavior | `src/App.tsx` |
| Change search, Web Share, Open-Meteo, or OpenStreetMap behavior | `src/App.tsx` |
| Connect/replace authentication | `src/firebase.ts` |
| Add hosted per-user trip persistence | new data adapter/API plus `src/firebase.ts` identity |
| Change core layout/design | `src/styles.css` |
| Change final mobile/responsive behavior | `src/final-polish.css` |
| Change accessibility defaults | `src/accessibility.css` |
| Change production server/config output | `server/index.ts` |
| Change Render/Firebase environment wiring | `render.yaml`, `.env.example` |
| Change CI/preflight behavior | `package.json`, `scripts/*`, `.github/workflows/ci.yml` |

## Verification commands

```bash
npm run check
npm run smoke:server
```

Use `docs/QA.md` afterward, including at least one physical-phone pass for native Web Share and touch-layout verification.
