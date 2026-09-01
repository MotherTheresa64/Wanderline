# Wanderline Deployment Runbook

## 1. Toolchain

Use Node `22.16.0` (the repository includes `.nvmrc`).

```bash
npm install
npm run check
npm run smoke:server
```

`npm run check` is the release gate. It typechecks the client, server, and test targets; runs the domain tests; builds the Vite client and Express host; and verifies required production artifacts.

`npm run smoke:server` starts the compiled Express server on a temporary port and verifies health/config/JSON-404 behavior.

## 2. Current runtime contract

The deployed public product is intentionally **local-first**.

No secret is required for:

- Google Maps universal search/direction URLs;
- Open-Meteo geocoding/current weather;
- USD formatting/calculations;
- browser-local workspace persistence.

The expected API status is:

```text
mode = local-first
persistence = browser-local
collaboration = local-demo
firestore = false
```

Firebase web configuration, when present, only enables the existing Google Authentication client. It does not change the persistence/collaboration values above.

## 3. Render

Production URL:

```text
https://wanderline-s1yv.onrender.com
```

Expected service configuration:

```text
Branch: main
Build: npm install --include=dev --no-audit --no-fund && npm run check
Start: npm start
Health: /api/health
Auto-Deploy: On Commit
Node: 22.16.0
```

`render.yaml` already defines the Firebase web-config placeholders. Maps and Open-Meteo do not require deployment secrets for the current integration approach.

## 4. Firebase Authentication

To enable Google sign-in:

1. create/select a Firebase project;
2. add a Web App;
3. enable Google Authentication;
4. authorize the deployed Render hostname;
5. set these Render environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

After deployment, verify sign-in success/failure handling in the UI.

**Important:** successful sign-in still leaves the trip workspace in browser-local storage until the Firestore phase below is implemented.

## 5. Firestore collaboration phase

Do not flip the product to “realtime collaborative” after Authentication alone.

A hosted persistence implementation should define real resource ownership for:

- user profiles;
- trips;
- memberships, roles, and invitations;
- activities, statuses, attendees, and votes;
- saved places;
- expenses, payers, participants, and custom shares;
- packing items/responsibility;
- notes;
- reservations;
- history.

Then add:

- repository/data adapters behind the current client persistence boundary;
- realtime listeners for shared trip resources;
- invitation delivery/acceptance;
- private trip-link resolution against authenticated membership;
- explicit concurrent-edit behavior;
- Firestore Security Rules.

Security Rules must enforce at minimum:

- authenticated membership for private trip reads;
- Owner-only membership/role/archive/delete operations;
- Editor writes to allowed planning resources;
- Viewer write rejection except any deliberately allowed vote path;
- validation of referenced member/trip IDs;
- amount/share constraints that protect financial integrity where feasible.

Only once that system is working and tested should UI metadata/API config report hosted collaboration.

## 6. Release verification

Before merging/deploying, confirm:

1. `npm run check` passes;
2. `npm run smoke:server` passes;
3. GitHub Actions is green;
4. app loads without an uncaught browser error;
5. existing valid v3 local data migrates to v4;
6. malformed local data recovers to the sample workspace;
7. trip date edits keep activities/bookings inside the new range;
8. itinerary shows one chronological card per non-suggested activity;
9. idea voting/promotion behaves according to role/status;
10. personal expense responsibility can differ from payer;
11. `$10 / 3` displays shares totaling exactly `$10`;
12. custom split validation is exact to the cent;
13. balances/settlements reconcile to zero total balance;
14. traveler removal is blocked while financial/shared-packing references exist;
15. safe removal preserves historical identity and cleans live attendee/vote references;
16. actual expense budget totals do not include itinerary estimates;
17. Google Maps special-character/international queries open correctly;
18. weather failure or ambiguous geocoding does not block planning;
19. booking dates remain inside the trip range;
20. Share summary contains no confirmation numbers and no fake invitation URL;
21. sign-in copy still states that trip persistence is local;
22. `/api/health` and `/api/config` accurately state local/browser persistence;
23. unknown `/api/*` returns JSON `404`.

## 7. Responsive/device pass

Test at minimum:

- `360x800` small Android portrait;
- `390x844` phone portrait;
- `844x390` phone landscape;
- `768x1024` tablet;
- `1366x768` laptop;
- `1920x1080` desktop;
- one physical Android or iOS device for touch + Web Share.

Check every product view and modal for:

- no page-level horizontal overflow;
- no card/control overlap;
- usable horizontal itinerary day tabs;
- readable body/help text;
- touch-friendly controls;
- modal scrolling and safe-area behavior;
- keyboard focus visibility;
- dialog/theme-picker focus trapping/restoration;
- reduced-motion behavior.

## 8. Rollback

Render Auto-Deploy tracks `main`. If a regression escapes CI:

1. restore the previous successful Render deployment or revert the responsible commit;
2. preserve user workspace compatibility when changing schema versions;
3. if a persistence migration itself is faulty, fix the parser/normalizer before asking users to reset local data.

The v4 loader intentionally retains a v3 migration path so this release does not require users to discard valid existing trip data.
