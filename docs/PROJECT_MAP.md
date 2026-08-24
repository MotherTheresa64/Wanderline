# Wanderline Project Map

```text
.
├── src/
│   ├── App.tsx             Itinerary, budget, packing, sharing, search, trip UI
│   ├── firebase.ts         Optional Firebase Google-auth adapter
│   ├── ErrorBoundary.tsx   Runtime recovery and local-data reset path
│   ├── styles.css          Main visual system and responsive layout
│   └── accessibility.css   Focus visibility and reduced-motion rules
├── server/
│   └── index.ts            Express production host and integration-readiness endpoints
├── scripts/
│   ├── verify-build.mjs    Required production-artifact verifier
│   └── smoke-server.mjs    Compiled-server integration smoke test
├── docs/
│   ├── ARCHITECTURE.md     Travel-domain/integration architecture
│   ├── DEPLOYMENT.md       Render/Firebase/provider deployment runbook
│   ├── QA.md               Functional/mobile/integration acceptance checklist
│   └── PROJECT_MAP.md      This file
├── .github/workflows/ci.yml
├── render.yaml
└── package.json
```

## Where to make common changes

| Goal | Primary files |
| --- | --- |
| Change itinerary/budget/packing behavior | `src/App.tsx` |
| Change Web Share/search behavior | `src/App.tsx` |
| Connect/replace authentication | `src/firebase.ts` |
| Add maps/weather provider endpoints | `server/` and normalized client adapters |
| Add hosted trip persistence | `server/` plus extracted client data adapters |
| Change layout/design | `src/styles.css` |
| Change accessibility defaults | `src/accessibility.css` |
| Change Render/environment wiring | `render.yaml`, `.env.example` |
| Change CI/preflight behavior | `package.json`, `scripts/*`, `.github/workflows/ci.yml` |

## Verification commands

```bash
npm run check
npm run smoke:server
```

Use `docs/QA.md` afterward, including a physical-phone pass for native Web Share.
