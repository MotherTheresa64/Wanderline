# Wanderline Project Map

```text
.
├── src/
│   ├── App.tsx             Collaborative product UI and all local CRUD/workflows
│   ├── model.ts           Workspace/trip/member/activity/expense domain model + derived calculations
│   ├── demo.ts            Rich Barcelona collaborative sample workspace
│   ├── storage.ts         Validated/versioned v2 local persistence adapter
│   ├── maps.ts            Google Maps universal search/directions links
│   ├── weather.ts         Destination geocoding + current weather via Open-Meteo
│   ├── firebase.ts        Optional Firebase Google-auth adapter
│   ├── theme.ts           Persistent four-theme appearance controller
│   ├── themes.css         Theme palettes + appearance picker
│   ├── app-v2.css        Rebuilt responsive collaborative Wanderline UI
│   ├── accessibility.css Focus visibility and reduced-motion rules
│   └── ErrorBoundary.tsx Runtime recovery + v2 local-workspace reset
├── server/
│   └── index.ts           Express production host and non-secret config/health endpoints
├── scripts/
│   ├── verify-build.mjs   Required production-artifact verifier
│   └── smoke-server.mjs   Compiled-server integration smoke test
├── docs/
│   ├── ARCHITECTURE.md    Collaborative domain / Firebase boundary
│   ├── DEPLOYMENT.md      Render/Firebase/Firestore deployment runbook
│   ├── QA.md              Functional/collaboration/mobile acceptance checklist
│   └── PROJECT_MAP.md     This file
├── .github/workflows/ci.yml
├── render.yaml
└── package.json
```

## Where to make common changes

| Goal | Primary files |
| --- | --- |
| Change trip/member/activity/expense types or calculations | `src/model.ts` |
| Change sample/recruiter demo content | `src/demo.ts` |
| Change local persistence / migration | `src/storage.ts` |
| Change Overview/Itinerary/Ideas/Places/Budget/Packing/Notes/Travelers UI | `src/App.tsx` |
| Change Google Maps behavior | `src/maps.ts` |
| Change destination weather behavior | `src/weather.ts` |
| Change theme choices/persistence | `src/theme.ts` |
| Change theme palettes/picker | `src/themes.css` |
| Change layout/responsive visual design | `src/app-v2.css` |
| Change accessibility defaults | `src/accessibility.css` |
| Connect/replace authentication | `src/firebase.ts` |
| Add Firestore real-time collaboration | new hosted repository/data adapter using `src/model.ts` shapes + Firebase identity |
| Change runtime recovery | `src/ErrorBoundary.tsx` |
| Change production API/config metadata | `server/index.ts` |
| Change Render/Firebase environment wiring | `render.yaml`, `.env.example` |
| Change CI/build/smoke behavior | `package.json`, `scripts/*`, `.github/workflows/ci.yml` |

## Important architectural boundary

The current app is a complete local collaborative product simulation. The following require the final Firebase/Firestore phase rather than UI-only code:

- real invitation delivery/acceptance;
- authenticated private trip membership;
- cross-device persistence;
- live multi-user synchronization;
- secure Owner/Editor/Viewer enforcement;
- public/private hosted trip links.

Those features should replace the storage/auth boundary without reworking the existing product screens.

## Verification

```bash
npm run check
npm run smoke:server
```

Then execute `docs/QA.md`, including 360px mobile layout, Google Maps handoff, expense split math, collaboration flows, themes, and at least one physical-phone Web Share pass.
