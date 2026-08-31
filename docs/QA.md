# Wanderline QA Checklist

Use this after a local build and again against the deployed Render URL.

## Smoke

- [ ] App loads with no blank screen or uncaught console error.
- [ ] Branded favicon/title appear.
- [ ] Product is usable without credentials.
- [ ] Refresh preserves itinerary, budget, packing, and saved-place changes.
- [ ] Error boundary presents a branded recovery screen if rendering fails.
- [ ] Sample-trip reset restores the original data without clearing unrelated browser storage.

## Itinerary

- [ ] Day tabs switch correctly and show accurate activity counts.
- [ ] Trip countdown is derived from the current date.
- [ ] Search filters by relevant activity content.
- [ ] Clearing search restores the day itinerary.
- [ ] Completing/reopening activities persists after refresh.
- [ ] New activity validates required fields.
- [ ] New activity preserves time, type, place, cost, duration, and note.
- [ ] Existing activity can be edited without losing completion state.
- [ ] Activity deletion removes the correct item.
- [ ] Activities remain ordered chronologically after create/edit.
- [ ] Trip progress updates when completion state changes.
- [ ] Zero-cost activities display as free rather than malformed currency.

## Budget

- [ ] Remaining budget equals total minus all expenses.
- [ ] Category totals update after adding or deleting an expense.
- [ ] Percentage visuals never produce `NaN`/division errors.
- [ ] Expense form rejects empty descriptions and non-positive amounts.
- [ ] Added expenses persist after refresh.
- [ ] Expense deletion persists after refresh.
- [ ] Search filters visible ledger rows without changing aggregate totals.

## Saved places

- [ ] New saved place validates a name and persists after refresh.
- [ ] Search covers name, category, neighborhood, and note.
- [ ] Details modal opens the correct place.
- [ ] Open map launches a URL-encoded OpenStreetMap search.
- [ ] Removing a saved place updates counts and persists.

## Packing

- [ ] Packing completion toggles correctly.
- [ ] Progress indicator matches checked items.
- [ ] Packing state persists after refresh.

## Weather and maps

- [ ] Header weather loads current Barcelona conditions from Open-Meteo when network access is available.
- [ ] Blocking/failing the weather request leaves a useful fallback state and does not break the app.
- [ ] Itinerary map opens Barcelona in OpenStreetMap.
- [ ] No private Maps or Weather API key is required or exposed.
- [ ] `/api/config` reports Open-Meteo/OpenStreetMap and Firebase readiness accurately.

## Sharing

- [ ] Native Web Share opens on supported mobile browsers.
- [ ] Clipboard fallback works on unsupported/desktop browsers.
- [ ] Cancelling native share does not crash or show a false success state.

## Authentication

Without Firebase:

- [ ] Profile control reports local/demo mode with useful feedback.
- [ ] Clicking sign-in cannot crash the app.

With Firebase:

- [ ] Google popup opens.
- [ ] Successful sign-in is acknowledged.
- [ ] Cancelled/failed authentication is handled cleanly.

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
- [ ] Escape closes the active modal/menu layer.
- [ ] Reduced-motion preference is respected.
- [ ] Touch targets remain usable on phone screens.
- [ ] No essential product area depends on horizontal desktop scrolling on a phone.

## Viewports / devices

- [ ] 360x800 small Android portrait
- [ ] 390x844 phone portrait
- [ ] 844x390 phone landscape
- [ ] 768x1024 tablet
- [ ] 1366x768 laptop
- [ ] 1920x1080 desktop
- [ ] At least one physical Android/iOS device for native Web Share verification
