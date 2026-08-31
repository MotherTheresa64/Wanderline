# Wanderline QA Checklist

Use this after automated verification and again against the deployed Render URL.

## Automated gate

- [ ] `npm run check` succeeds.
- [ ] `npm run smoke:server` succeeds.
- [ ] Production build contains client and server artifacts.

## Smoke / persistence

- [ ] App loads without a blank screen or uncaught error.
- [ ] Credential-free sample workspace is immediately usable.
- [ ] Refresh preserves v2 trip workspace changes.
- [ ] Malformed/unavailable local storage falls back safely.
- [ ] Error boundary can reload or clear `wanderline-workspace-v2` correctly.
- [ ] Sample reset restores the original Barcelona collaboration workspace without removing theme preference.

## Multiple trips

- [ ] New trip requires a name/destination and valid dates.
- [ ] New trip becomes active immediately.
- [ ] Trip switcher changes the active trip.
- [ ] Trip name, destination, dates, description, and USD budget can be edited.
- [ ] Archive removes a trip from the active switcher and selects a valid fallback trip.
- [ ] Delete requires confirmation and removes only the intended trip.
- [ ] At least one trip always remains usable in the local workspace.

## Travelers / permissions

- [ ] Active and pending travelers are distinguishable.
- [ ] Owner, Editor, and Viewer roles display clearly.
- [ ] Owner can change Editor/Viewer roles.
- [ ] Owner can remove another traveler after confirmation.
- [ ] Pending local invitation prevents duplicate email invitations.
- [ ] Viewer does not receive shared-resource editing controls.
- [ ] Owner-only controls are identified for later Firestore rule enforcement.

## Collaborative ideas

- [ ] Suggested activities appear in Ideas, not the itinerary.
- [ ] Vote/unvote changes only the current user's vote.
- [ ] Vote counts update immediately and persist.
- [ ] Editor can move an idea to Planned.
- [ ] Editor can Confirm an idea.
- [ ] Promoted ideas leave Ideas and appear in the itinerary.
- [ ] Editing an idea preserves votes/creator metadata.

## Itinerary

- [ ] Each activity appears exactly once in the chronological timeline.
- [ ] No duplicate/floating activity card overlaps another itinerary card.
- [ ] Day tabs derive from the trip start/end dates.
- [ ] Activity count per day is accurate.
- [ ] Activities sort chronologically after creation/editing.
- [ ] Add/edit form preserves date, time, category, place, duration, USD cost, note, status, and attendees.
- [ ] Completing/reopening an activity persists.
- [ ] Deleting an activity removes only the intended item.
- [ ] Creator name and attendee count display correctly.
- [ ] Google Maps search opens the activity location.
- [ ] Google Maps walking directions open the activity destination.
- [ ] Zero-cost activity can display `Free`.

## Saved places

- [ ] Place creation validates a name.
- [ ] Search covers name/category/neighborhood/note.
- [ ] Place edit persists.
- [ ] Place delete requires the intended user action and persists.
- [ ] Google Maps opens the correct place/destination query.
- [ ] “Add to itinerary” pre-fills the activity form from the place.
- [ ] Converting a saved place does not remove the original saved place.

## USD budget / expenses

- [ ] All visible money uses USD `$` formatting.
- [ ] Overall spent equals the complete expense ledger.
- [ ] Remaining equals budget minus spent.
- [ ] Category breakdown totals match the ledger.
- [ ] Expense search changes visible rows but not aggregate totals.
- [ ] Add/edit/delete expense persists.
- [ ] Payer can be changed.
- [ ] Personal expense assigns the full share only to its payer.
- [ ] Equal split divides the amount across selected participants.
- [ ] Custom split cannot submit unless entered shares equal the expense amount.
- [ ] Per-member Paid / Share / Balance values are correct.
- [ ] Settlement recommendations move value from negative balances to positive balances without creating/destroying money.

## Packing

- [ ] Shared items show who is responsible.
- [ ] Personal section shows only current-user personal items.
- [ ] Add item supports personal/shared scope and assignment.
- [ ] Completion toggle persists.
- [ ] Delete removes only the intended item.
- [ ] Overall packing progress derives from all packing items.

## Notes / reservations

- [ ] Shared notes can be added, edited, and deleted.
- [ ] Note author/update metadata is displayed.
- [ ] Reservations support type/title/date/time/location/confirmation/note.
- [ ] Reservation editing does not mutate array order during render.
- [ ] Reservations render in chronological order.
- [ ] Reservation location opens Google Maps.

## Activity history

- [ ] Meaningful mutations append a history row.
- [ ] History row identifies the member responsible.
- [ ] Newest history events appear first.
- [ ] History remains bounded rather than growing indefinitely in local storage.

## Search

- [ ] `Ctrl/Cmd + K` focuses global search.
- [ ] Search spans activities, places, expenses, notes, reservations, and travelers.
- [ ] Selecting a result opens the appropriate product view.
- [ ] Search results clear after navigation.
- [ ] Search result panel does not overflow narrow viewports.

## Weather / Google Maps

- [ ] Weather geocodes the active trip destination, not a hardcoded city.
- [ ] Current temperature uses Fahrenheit.
- [ ] Failed geocoding/weather requests do not break the app.
- [ ] Map actions use Google Maps universal URLs.
- [ ] No Google Maps API key or billing configuration is required for current map actions.
- [ ] `/api/config` reports `google-maps-universal-links`, Open-Meteo, USD, and Firebase readiness accurately.

## Sharing

- [ ] Native Web Share opens where supported.
- [ ] Clipboard fallback copies trip text/link where Web Share is unavailable.
- [ ] Cancelling native sharing does not show a false error.

## Appearance

- [ ] Sunset, Coast, Terracotta, and Night train themes are selectable.
- [ ] Theme persists independently from trip data.
- [ ] Browser theme-color follows appearance.
- [ ] All v2 surfaces/forms/timeline/panels remain readable in all themes.
- [ ] Night train has adequate contrast.
- [ ] Appearance control does not cover toast feedback.

## Authentication boundary

Without Firebase:

- [ ] Product stays fully usable in local collaborative demo mode.
- [ ] Sign-in action explains that Firebase is not connected rather than crashing.
- [ ] Pending invitation UX is clearly local/demo behavior.

With Firebase later:

- [ ] Google popup succeeds/fails gracefully.
- [ ] Authenticated user identity replaces demo identity.
- [ ] Firestore membership controls actual shared trip reads/writes.
- [ ] Owner-only writes are rejected database-side for unauthorized users.
- [ ] Viewer writes are rejected database-side.

## Production host

- [ ] `GET /api/health` -> `200` JSON.
- [ ] `GET /api/config` -> `200` JSON.
- [ ] Unknown `/api/*` -> JSON `404`.
- [ ] Hard refresh on SPA routes works.
- [ ] Hashed assets have long cache headers.
- [ ] HTML remains fresh across deploys.
- [ ] Security headers are present.

## Accessibility / responsive behavior

- [ ] Visible focus state on keyboard-accessible controls.
- [ ] Forms are usable without a mouse.
- [ ] Escape closes active modal/menu/search state.
- [ ] Reduced-motion preference is respected.
- [ ] Touch targets remain usable on phones.
- [ ] Mobile navigation uses an off-canvas panel + backdrop.
- [ ] Timeline stacks without overlap or page-level horizontal scrolling.
- [ ] Modals fit and scroll on small devices.
- [ ] No essential interaction requires hover.

## Required viewports / device pass

- [ ] 360x800 small Android portrait
- [ ] 390x844 phone portrait
- [ ] 844x390 phone landscape
- [ ] 768x1024 tablet
- [ ] 1366x768 laptop
- [ ] 1920x1080 desktop
- [ ] At least one physical Android/iOS device for touch + Web Share validation
