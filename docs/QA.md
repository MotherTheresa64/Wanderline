# Wanderline QA Checklist

Run automated verification first, then complete this checklist against both local development and the deployed Render build.

## Automated gate

- [ ] `npm run check` succeeds.
- [ ] Domain tests pass.
- [ ] Client/server/test TypeScript targets pass.
- [ ] Vite and Express production builds succeed.
- [ ] Build artifacts verify.
- [ ] `npm run smoke:server` succeeds.
- [ ] GitHub Actions is green.

## Persistence / recovery

- [ ] Fresh browser loads the Barcelona sample workspace.
- [ ] v4 edits survive refresh under `wanderline-workspace-v4`.
- [ ] A valid v3 workspace migrates to v4 automatically.
- [ ] Malformed nested local data falls back safely rather than partially rendering corrupt state.
- [ ] Error boundary reload works.
- [ ] Error-boundary reset clears v4 and legacy v3 Wanderline workspace data only.
- [ ] Sample reset preserves theme preference.

## Trip invariants

- [ ] Create trip requires name, destination, start date, and valid end date.
- [ ] `startDate <= endDate` is always maintained.
- [ ] New trip becomes active.
- [ ] Trip switcher selects an existing non-archived trip.
- [ ] Editing destination updates weather request context.
- [ ] Shortening dates moves pre-existing out-of-range activities to the nearest valid boundary day.
- [ ] Shortening dates moves pre-existing out-of-range reservations to the nearest valid boundary day.
- [ ] Date edits do not duplicate activities/reservations.
- [ ] Archive/delete switches to a usable non-archived fallback trip.
- [ ] Final active trip cannot be archived/deleted through the UI.
- [ ] Active trip/current user recover to valid references after normalized local loading.

## Date/time correctness

Test around a DST transition and with the browser timezone west/east of UTC.

- [ ] September 3 displays as September 3 in every tested timezone.
- [ ] Day tabs include every date exactly once.
- [ ] Multi-week trip date generation has no gaps/duplicates.
- [ ] Reversed/invalid ranges do not generate fake dates.
- [ ] Countdown is based on the user's local calendar date, not UTC midnight.
- [ ] Activities order by date then time.
- [ ] Same-day equal-time activities have stable fallback ordering.
- [ ] Reservations sort chronologically without mutating canonical array order during render.
- [ ] Activity and reservation forms reject dates outside the trip range.

## Ideas → itinerary

- [ ] Suggested activities appear only in Ideas.
- [ ] Suggested activity uses the same canonical object when promoted.
- [ ] Active owner/editor/viewer can vote/unvote.
- [ ] Pending traveler cannot vote.
- [ ] Removed traveler cannot vote.
- [ ] Viewer does not receive edit/promote/delete controls.
- [ ] Editor can promote to Planned.
- [ ] Editor can promote to Confirmed.
- [ ] Promoted item disappears from Ideas and appears exactly once in the itinerary.
- [ ] Creator/votes/attendees/date/time/notes survive promotion.
- [ ] Idea edit/delete behaves predictably.

## Itinerary

- [ ] Add/edit/delete persists.
- [ ] Complete/reopen persists.
- [ ] Each activity renders exactly once.
- [ ] Day tabs show accurate counts.
- [ ] Time/category/location/note/duration/attendees/cost/status persist.
- [ ] Zero cost displays `Free`.
- [ ] Creator displays correctly for active and former travelers.
- [ ] Google Maps search works for location.
- [ ] Walking directions work for location.
- [ ] Blank location is blocked by the form/Maps helper.
- [ ] Narrow-phone timeline does not overlap its time rail/status/card.

## Travelers / permissions

- [ ] Owner has trip/member/edit controls.
- [ ] Editor has planning edit controls but no role/removal/trip settings controls.
- [ ] Active viewer can read and vote but not edit planning resources.
- [ ] Pending/removed/missing current member cannot mutate trip resources.
- [ ] Duplicate active/pending email invitation is blocked.
- [ ] Re-inviting a removed traveler reuses the historical member identity as pending.
- [ ] Final active owner cannot be downgraded.
- [ ] Final active owner cannot be removed.
- [ ] Traveler removal is blocked when referenced as payer/participant by an expense.
- [ ] Traveler removal is blocked when assigned shared packing responsibility.
- [ ] Once references are resolved, removal marks the active traveler `removed`.
- [ ] Removed traveler disappears from live traveler list.
- [ ] Removed traveler remains resolvable in note/place/activity/history authorship.
- [ ] Removed traveler is scrubbed from activity attendees/votes.
- [ ] Personal packing assigned to removed traveler is removed.
- [ ] Pending invitation removal hard-deletes the pending member.

## Financial correctness

### General

- [ ] All actual ledger money uses USD formatting.
- [ ] Amount must be positive.
- [ ] Payer must be active.
- [ ] Participants must be active.
- [ ] Actual `spent` equals the full expense ledger, independent of search filter.
- [ ] Activity estimated costs do not contribute to actual spent/balances.
- [ ] Expense edit/delete immediately updates budget/balances.

### Personal

- [ ] Personal expense has exactly one responsible traveler.
- [ ] Responsible traveler can differ from payer.
- [ ] Payer receives credit for amount paid.
- [ ] Responsible traveler receives the full owed share.

### Equal

- [ ] `$10.00 / 3` becomes `$3.34 + $3.33 + $3.33`.
- [ ] Equal shares always sum to the original integer-cent amount.
- [ ] Empty participant selection is rejected.

### Custom

- [ ] Negative shares are rejected.
- [ ] Non-selected traveler shares are ignored/not persisted as participants.
- [ ] `$9.99` total for a `$10.00` expense is rejected.
- [ ] `$10.01` total for a `$10.00` expense is rejected.
- [ ] Exact cent total succeeds.
- [ ] Validation error is announced/accessibly visible.

### Balances / settlements

- [ ] Paid/share/balance rows reconcile to zero total balance.
- [ ] Traveler may pay without participating and receive the correct positive balance.
- [ ] Settlements move value only from debtors to creditors.
- [ ] Settlement amounts are exact to cents.
- [ ] Settlement loop terminates.
- [ ] No `-0`, `$0.01` floating residual, NaN, or Infinity appears.

## Budget

- [ ] Empty/zero budget is handled without division errors.
- [ ] Negative budget input normalizes to zero.
- [ ] Remaining = budget - actual spent.
- [ ] Over-budget state clearly says amount over.
- [ ] Usage percentage is bounded for progress rendering.
- [ ] Category breakdown equals actual ledger totals.
- [ ] Expense search changes visible rows only, never aggregate totals.

## Saved places / Google Maps

- [ ] Add/edit/remove/search works.
- [ ] Search includes name/category/neighborhood/note.
- [ ] Place → itinerary pre-fills title/location/note.
- [ ] Place → itinerary leaves saved place intact.
- [ ] Google Maps URLs encode apostrophes/accents/special characters.
- [ ] International place names open correctly.
- [ ] Blank map queries are ignored.
- [ ] Directions include origin only when one is intentionally provided.
- [ ] Current product requires no paid Maps SDK/API key.

## Weather

- [ ] Destination change cancels/obsoletes prior request.
- [ ] Full destination context helps disambiguate repeated city names.
- [ ] Current temperature is Fahrenheit.
- [ ] Successful repeat destination can use cache.
- [ ] Failed geocode shows unavailable state without breaking trip UI.
- [ ] Empty geocode result shows unavailable state.
- [ ] Forecast API failure shows unavailable state.
- [ ] Slow request shows loading state.
- [ ] Weather text has an accessible label.
- [ ] Weather failure never blocks forms/navigation.

## Packing

- [ ] Add personal/shared item works.
- [ ] Shared responsibility must be an active traveler.
- [ ] Duplicate identical assignment is blocked.
- [ ] Complete/reopen persists.
- [ ] Progress reflects all canonical packing items.
- [ ] Current user's personal list shows only their personal items.
- [ ] Viewer cannot toggle/delete/add.
- [ ] Member removal shared-responsibility block works.

## Notes / bookings

- [ ] Notes add/edit/delete.
- [ ] Note author and update timestamp remain meaningful.
- [ ] Booking type/date/time/location/confirmation/note persist.
- [ ] Booking date stays within trip range.
- [ ] Booking location opens Google Maps.
- [ ] Share summary never includes confirmation/reference values.
- [ ] Share summary never includes booking note secrets.

## Sharing

- [ ] Share action is labeled **Share summary**, not invite/share-trip link.
- [ ] Native Web Share receives only non-sensitive summary text.
- [ ] No current-page URL is presented as a collaborative join link.
- [ ] Clipboard fallback copies summary text.
- [ ] Native share cancellation does not show a false error.
- [ ] Clipboard denial shows graceful feedback.
- [ ] Desktop/mobile HTTPS provider behavior is acceptable.

## Authentication / cloud boundary

Without Firebase config:

- [ ] App remains fully usable in browser-local mode.
- [ ] Sign-in action explains Authentication is not configured.

With Firebase Authentication configured:

- [ ] Google popup succeeds/fails gracefully.
- [ ] Success message explicitly says trip data remains browser-local.
- [ ] `/api/config` still reports `firestore: false` and `collaboration: local-demo`.
- [ ] No UI implies that sign-in makes pending invitations real or synchronizes trips.

Future Firestore release only:

- [ ] Membership enforced in database rules.
- [ ] Owner/editor/viewer writes enforced in database rules.
- [ ] Real invitation delivery/acceptance exists.
- [ ] Private join links resolve authenticated membership.
- [ ] Realtime listener behavior is tested with concurrent users.

## Search

- [ ] `Ctrl/Cmd + K` focuses global search.
- [ ] Search covers activities, places, expenses, notes, bookings, travelers.
- [ ] Selecting result navigates to correct product view.
- [ ] Search clears after result selection/navigation.
- [ ] Result panel is bounded/scrollable on small screens.
- [ ] Removed travelers are excluded from live search results.

## Themes / accessibility

- [ ] Sunset, Coast, Terracotta, Night train selectable.
- [ ] Theme persists separately from workspace.
- [ ] Browser theme-color follows selected theme.
- [ ] Theme dialog receives keyboard focus when opened.
- [ ] Tab/Shift+Tab stay inside theme dialog.
- [ ] Escape closes theme dialog.
- [ ] Focus returns after theme dialog closes.
- [ ] App modal receives initial focus.
- [ ] Tab/Shift+Tab stay inside app modal.
- [ ] Escape closes app modal.
- [ ] Focus returns to opener after modal closes.
- [ ] Form errors have `role=alert`/live feedback where needed.
- [ ] Status is not communicated by color alone.
- [ ] Focus-visible indicator appears on keyboard controls.
- [ ] Reduced-motion preference removes transitions/animations.

## Responsive pass

### 360x800

- [ ] No page-level horizontal scrolling.
- [ ] Header/share/menu remain usable.
- [ ] Hero and stats stack cleanly.
- [ ] Itinerary time rail/card do not overlap.
- [ ] Day tabs scroll horizontally.
- [ ] Expense rows reflow.
- [ ] Traveler rows/select/remove controls reflow.
- [ ] Modals fit and scroll.
- [ ] Theme picker does not cover critical modal/toast controls.

### 390x844

- [ ] All views feel like phone layouts, not mini desktop tables.
- [ ] Cards/actions are touch-friendly.
- [ ] Packing can be used one-handed.

### 844x390 landscape

- [ ] Sidebar does not consume unusable width.
- [ ] Vertical space remains for page content.
- [ ] Modal/theme picker can scroll inside short viewport.

### 768x1024 tablet

- [ ] Two-column layouts are sensible where present.
- [ ] Itinerary aside collapses before it becomes cramped.

### 1366x768 / 1920x1080

- [ ] Content width remains readable.
- [ ] Sticky sidebar/header/itinerary aside do not overlap.
- [ ] No dead or floating duplicate content.

### Physical phone

- [ ] Touch targets are comfortable.
- [ ] Off-canvas navigation/backdrop works.
- [ ] Native Web Share works/cancels gracefully.
- [ ] On-screen keyboard does not make forms unusable.
- [ ] Safe-area padding is acceptable on notched devices.

## Destructive actions / failure pass

- [ ] Delete activity, idea, place, expense, packing, note, reservation requires intentional action.
- [ ] Trip archive/delete confirmation and fallback behavior are correct.
- [ ] Member removal explains unresolved references rather than silently mutating money.
- [ ] Reset sample trip confirmation is clear.
- [ ] Weather network failure tested.
- [ ] Blocked localStorage behavior tested.
- [ ] Clipboard denial tested.
- [ ] Firebase popup failure/cancel tested when configured.

## Representative trip scenarios

Before release, manually exercise:

- [ ] solo weekend;
- [ ] couple trip;
- [ ] five-person group with mixed roles;
- [ ] long/multi-week trip;
- [ ] over-budget trip;
- [ ] group with `$10 / 3` and custom split expenses;
- [ ] member removal after resolving referenced expenses/packing;
- [ ] date-range shrink with activities/bookings on removed days.

A release is ready when a new user can plan a real trip without encountering fake collaboration, incorrect cents, date shifts, orphaned references, dead controls, overlapping layouts, or misleading share/auth behavior.
