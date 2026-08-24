# Wanderline QA Checklist

Use this after a local build and again against the deployed Render URL.

## Smoke

- [ ] App loads with no blank screen or uncaught console error.
- [ ] Branded favicon/title appear.
- [ ] Demo trip is usable without credentials.
- [ ] Refresh preserves itinerary, budget, and packing changes.
- [ ] Error boundary presents a branded recovery screen if rendering fails.

## Itinerary

- [ ] Day tabs switch correctly and show accurate activity counts.
- [ ] Trip countdown is derived from the current date.
- [ ] Search filters by relevant activity content.
- [ ] Clearing search restores the day itinerary.
- [ ] Completing/reopening activities persists after refresh.
- [ ] New activity validates required fields.
- [ ] New activity preserves time, type, place, cost, and note.
- [ ] Trip progress updates when completion state changes.
- [ ] Zero-cost activities display as free rather than malformed currency.

## Budget

- [ ] Remaining budget equals total minus expenses.
- [ ] Category totals update after adding an expense.
- [ ] Percentage visuals never produce `NaN`/division errors.
- [ ] Expense form rejects empty descriptions and non-positive amounts.
- [ ] Added expenses persist after refresh.

## Packing

- [ ] Packing completion toggles correctly.
- [ ] Progress indicator matches checked items.
- [ ] Packing state persists after refresh.

## Sharing

- [ ] Native Web Share opens on supported mobile browsers.
- [ ] Clipboard fallback works on unsupported/desktop browsers.
- [ ] Cancelling native share does not crash or show a false success state.

## Authentication

Without Firebase:

- [ ] Profile control reports demo mode/useful feedback.
- [ ] Clicking sign-in cannot crash the app.

With Firebase:

- [ ] Google popup opens.
- [ ] Successful sign-in is acknowledged.
- [ ] Cancelled/failed authentication is handled cleanly.

## Maps/weather integration readiness

- [ ] App still works with no provider keys.
- [ ] `/api/config` correctly reports provider/Firebase readiness.
- [ ] Provider secrets are never rendered into browser-visible configuration.
- [ ] Real provider integration, once added, fails gracefully back to useful UI.

## Production host

- [ ] `GET /api/health` -> `200` JSON.
- [ ] `GET /api/config` -> `200` JSON.
- [ ] Unknown `/api/*` -> JSON `404`.
- [ ] Hard refresh works.
- [ ] Hashed assets have long cache headers.
- [ ] HTML remains fresh across deploys.
- [ ] Security headers are present.

## Accessibility

- [ ] Keyboard focus is clearly visible.
- [ ] Modal controls can be completed without a mouse.
- [ ] Reduced-motion preference is respected.
- [ ] Touch targets and horizontal layouts remain usable on phone screens.

## Viewports / devices

- [ ] 390x844 phone portrait
- [ ] 844x390 phone landscape
- [ ] 768x1024 tablet
- [ ] 1366x768 laptop
- [ ] 1920x1080 desktop
- [ ] At least one physical Android/iOS device for Web Share verification
