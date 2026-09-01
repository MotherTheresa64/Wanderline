# Wanderline Architecture

## Product goal

Wanderline is a travel-planning workspace that works naturally for one traveler and models the workflows needed by a group. The current public release is deliberately usable without credentials and stores the trip workspace locally in the browser. It does **not** claim that locally modeled roles, votes, or invitations are already synchronized multi-user features.

The architecture prioritizes travel-domain correctness over infrastructure for its own sake: date-only trip days, cent-accurate shared expenses, reference-safe membership changes, clear permissions, resilient provider integrations, and a clean future Firestore boundary.

## Runtime shape

```text
Browser
  React 19 + TypeScript
      |
      +-- app/App.tsx          orchestration, navigation, persistence, permission gates
      +-- app/views.tsx        domain views
      +-- app/forms.tsx        validated mutations/forms
      +-- app/shared.tsx       reusable UI/dialog primitives
      |
      +-- model.ts             pure domain rules/calculations
      +-- storage.ts           validated v4 local persistence + v3 migration
      +-- firebase.ts          optional Google Authentication only
      +-- weather.ts           Open-Meteo geocoding/current weather/cache
      +-- maps.ts              Google Maps universal URL helpers
      +-- theme.ts             persisted accessible appearance picker
      |
Express production host
      +-- /api/health          truthful local/auth/persistence status
      +-- /api/config          non-secret integration capability facts
      +-- static Vite build / SPA fallback
```

## Workspace and persistence

`Workspace.version` is `4`.

The active browser key is:

```text
wanderline-workspace-v4
```

`storage.ts` also knows the legacy v3 key. Loading follows this sequence:

1. parse v4 if present;
2. deeply validate nested trip/member/activity/place/expense/packing/note/reservation/history shapes;
3. otherwise parse valid v3 data;
4. normalize it to v4 and persist under the v4 key;
5. if neither payload is trustworthy, load the built-in sample workspace.

Normalization restores usable active-trip/current-user references, cleans invalid live member references, clamps dated resources into the trip date range, and prevents malformed browser data from crashing the app.

## Trip invariants

A usable trip maintains:

- `startDate <= endDate`;
- at least one active owner when there are active members;
- dated activities/reservations inside the trip range;
- an active-trip selection that prefers a non-archived trip;
- live attendee/vote/packing/expense references pointing to active travelers where required.

The UI does not allow archiving/deleting the final active trip. Editing dates calls `reconcileTripDateRange()`, which moves an out-of-range activity/reservation to the nearest new boundary rather than silently hiding or orphaning it.

## Date/time design

Trip days are **date-only values**, represented as `YYYY-MM-DD` and converted through UTC-only helpers when iteration/formatting is required. This prevents a September 3 itinerary day from becoming September 2 because the browser is west of UTC.

Timestamps remain timestamps for history/note update metadata.

Key helpers include:

- `isValidDateOnly`
- `tripDates`
- `dateInTrip`
- `clampDateToTrip`
- `localTodayDateOnly`
- `countdownToDate`
- `sortActivitiesChronologically`

The countdown compares the destination trip date to the user's **local calendar date**, while the difference itself is computed between normalized date-only values so DST-length days do not distort the count.

## Ideas and itinerary

Suggestions and committed itinerary entries share the same `Activity` model.

States:

- `suggested`
- `planned`
- `confirmed`
- `completed`

This avoids creating a second copy of an activity when an idea is accepted. Promotion is a status transition; creator, votes, attendees, date/time, cost estimate, and notes remain attached to the same activity ID.

The itinerary filters out `suggested` activities and sorts the remaining canonical activities by date/time, producing exactly one timeline card per activity.

## Membership and permissions

Member roles:

- **Owner** — full editing plus member/trip management.
- **Editor** — shared planning-resource writes.
- **Viewer** — read-only planning, with active viewers intentionally allowed to vote.

Member statuses:

- `active`
- `pending`
- `removed`

`permissionsFor()` centralizes client capability decisions. Missing, pending, and removed members cannot write or vote.

### Removed-traveler tombstones

An active traveler who is safely removed becomes `status: removed` instead of being erased. This lets historical authorship and activity-log events still resolve to a name.

Removal is deliberately blocked when the traveler is referenced by:

- an expense as payer or participant; or
- a shared packing item as responsible traveler.

Those resources must be explicitly reassigned or removed first. Once removal is safe, live activity attendee/vote references are scrubbed and personal packing assigned to the removed traveler is removed.

Pending invitations, by contrast, can be hard-deleted because they have not become active trip membership yet.

## Financial model

Money-domain calculations use integer cents.

### Personal

`participantIds[0]` identifies the traveler responsible for the full amount. `paidBy` is independent, so one traveler may front another traveler's personal expense.

### Equal

`equalSplitCents()` divides integer cents, then distributes remainder cents deterministically in participant order.

Example:

```text
$10.00 / 3 = $3.34 + $3.33 + $3.33
```

### Custom

Custom shares are converted to cents and must:

- be nonnegative;
- reference active selected participants;
- total exactly the expense amount to the cent.

### Balances and settlements

`balances()` accumulates integer cents paid and owed for active travelers, then converts to display dollars.

`calculateSettlements()` matches debtors and creditors using integer cents. It terminates when either side is exhausted and cannot produce floating-point penny residuals.

### Budget semantics

The trip budget uses **actual expenses only**. Activity `cost` values are planning estimates displayed in the itinerary/day estimate and are not added into spent/balance totals, preventing double-counting.

## Saved places and Maps

Saved places remain a separate wishlist resource. Creating an itinerary activity from a saved place pre-fills a new activity but does not remove or duplicate the saved-place record in itinerary rendering.

`maps.ts` builds encoded Google Maps universal URLs for search and walking directions. Blank destinations are rejected. The current product deliberately avoids a paid embedded Maps SDK because handoff provides the needed product value at lower complexity.

## Weather

`weather.ts`:

1. searches Open-Meteo geocoding with the destination's primary place name;
2. evaluates multiple candidates against the full destination string (city/region/country terms);
3. requests current Fahrenheit conditions;
4. caches a successful destination result for ten minutes;
5. aborts stale requests on destination change/unmount;
6. degrades to an unavailable state on any provider failure.

Weather is never part of the trip-state persistence path and cannot block planning.

## Sharing and sensitive data

The current app does **not** generate a functional collaborative invite URL because there is no hosted membership datastore yet.

`Share summary` sends/copies only high-level trip summary text. It does not include:

- reservation confirmation/reference values;
- a misleading current-page “join” URL; or
- hidden browser-local state.

## Accessibility and responsive architecture

The large original app component has been split along real domain/UI seams instead of decomposed purely by line count.

Dialog behavior includes:

- `role="dialog"` + `aria-modal`;
- initial focus;
- Tab/Shift+Tab trapping;
- Escape close;
- focus restoration.

The theme picker implements equivalent focus behavior.

`polish.css` is loaded after the original themed layout CSS to provide the final readable/touch-friendly responsive layer without discarding the established visual system.

## Authentication vs collaboration

`firebase.ts` currently initializes **Firebase Authentication only** when web config exists.

The production API intentionally reports:

```text
mode: local-first
persistence: browser-local
collaboration: local-demo
firestore: false
```

A configured Firebase project changes authentication readiness, not persistence/collaboration status.

## Firestore target

A real hosted release should place an authenticated repository/data layer behind the current domain/UI boundary. At minimum it needs resources for:

- users;
- trips;
- members/invitations;
- activities/votes/attendees;
- saved places;
- expenses/splits;
- packing;
- notes;
- reservations;
- history.

Firestore Security Rules must enforce membership and role writes. React permissions are UX safeguards, not a security boundary.

Realtime listeners can then replace browser-local persistence for shared resources. Concurrent edits and invitation acceptance must be handled deliberately before the product is described as realtime collaborative.

## Verification architecture

`npm run check` gates:

1. client TypeScript;
2. server TypeScript;
3. test TypeScript;
4. domain tests;
5. production builds;
6. artifact verification.

`npm run smoke:server` then exercises the compiled Express health/config/404 contract.

The highest-risk money/date/member rules are pure helpers so they can be verified independently from rendering.
