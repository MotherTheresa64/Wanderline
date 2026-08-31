# Wanderline Project Map

```text
.
├── src/
│   ├── App.tsx             Itinerary, budget, packing, saved places, weather, maps, sharing, search
│   ├── firebase.ts         Optional Firebase Google-auth adapter
│   ├── theme.ts            Persistent four-theme appearance controller
│   ├── currency.ts         React-safe USD presentation/localization layer
│   ├── ErrorBoundary.tsx   Runtime recovery and local-data reset path
│   ├── styles.css          Core visual system
│   ├── final-polish.css    Responsive/mobile and final product overrides
│   ├── themes.css          Travel-theme palettes and theme-aware surface system
│   ├── release-polish.css Final presentation/micro-interaction layer and theme token bridge
│   ├── usd.css             USD-specific presentation rule for legacy currency iconography
│   ├── theme-layout.css   Theme-control/toast layout safeguards
│   └── accessibility.css Focus visibility and reduced-motion rules
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
| Change theme choices/persistence | `src/theme.ts` |
| Change theme palettes/surfaces | `src/themes.css`, `src/release-polish.css` |
| Change USD display behavior | `src/currency.ts`, `src/usd.css` |
| Change final feedback/theme-control placement | `src/theme-layout.css` |
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

Use `docs/QA.md` afterward, including theme coverage, USD verification, and at least one physical-phone pass for native Web Share and touch-layout verification.
