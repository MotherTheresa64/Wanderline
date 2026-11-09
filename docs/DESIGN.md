# Design notes: the Night map system

Why Wanderline looks the way it does, and how the appearance layer is built.

## The brief

Wanderline is a shared planning desk for a trip. People open it at night, on a couch, between messages, to compare train times, split a hotel bill, and agree on tomorrow. The interface should feel like a quiet map room, not a light travel brochure.

That brief ruled out the usual travel-app language: white cards, postcard photography, and a single bright accent. It also ruled out a light mode. The app has four appearances, and every one of them is dark.

## Design thesis

- **Surface is map ink.** The canvas is `#0a1110` with a faint 64px grid and two wide glows: lantern amber from above the hero, cool route light from the lower left. The grid is quiet enough to read as paper grain, not decoration.
- **Colour carries meaning.** Amber is reserved for actions and attention. Sage marks confirmed plans, routes, and progress. Ivory is reading text. Everything else steps back into muted sage-grey.
- **Serif for the guide, sans for the controls.** Trip names, page titles, place names, and card headings use a Palatino/Iowan stack. Controls, labels, and data stay in the system UI sans. Money and times use tabular figures so columns line up.
- **Dense, but not cramped.** Planning screens hold a lot of small facts. The layout compensates with real padding (24px panels, 22px gaps, 40px page gutters) instead of shrinking every card to fit more in.

The result should read as "a workspace someone uses", not "a template someone filled".

## Tokens

Defined per appearance in [`src/night-map-theme.css`](../src/night-map-theme.css); these are the Night map values:

| Token | Value | Used for |
| --- | --- | --- |
| `--theme-bg` | `#0a1110` | Page canvas behind the grid |
| `--theme-sidebar` | `#0c1513` | Navigation column |
| `--theme-surface` | `#111b17` | Panels and cards |
| `--theme-surface-2` | `#152220` | Raised inner blocks, secondary actions |
| `--theme-surface-3` | `#1c2c27` | Category tiles, icon wells |
| `--theme-line` | `#23342d` | Card borders, dividers, tracks |
| `--theme-text` | `#f2ede2` | Primary reading text |
| `--theme-muted` | `#9aa89c` | Secondary text, metadata |
| `--theme-accent` | `#e2a15c` | Primary actions, kickers, active markers |
| `--theme-accent-2` | `#c8d9a8` | Warm secondary highlight |
| `--theme-green` | `#4a8a71` | Confirmed state, progress, route actions |

Night map also calms the primary green from the earlier `#4f8f77` to `#4a8a71`, because the brighter mint pulled too much attention next to the amber.

### Palettes

All four appearances share the layout rules. Only colour changes, and every value is dark:

| Appearance | Canvas | Action accent | Confirmed / route |
| --- | --- | --- | --- |
| Night map (default) | `#0a1110` | `#e2a15c` | `#4a8a71` |
| Sunset | `#101817` | `#e17a59` | `#4f8f7a` |
| Terracotta | `#171411` | `#d9795d` | `#7c8a63` |
| Night train | `#11191e` | `#e5a76f` | `#558f8b` |

Switching appearance swaps this token block and nothing else. Surfaces, spacing, radii and the type scale are declared once, so the workspace repaints without reflowing.

## Theme architecture

Appearance is data, not a separate build:

- [`src/theme.ts`](../src/theme.ts) defines four `ThemeOption`s. Each one carries an id, label, description, swatch pair, browser `theme-color`, and a `scheme`. `scheme` drives `document.documentElement.style.colorScheme`, so native form controls and scrollbars match.
- The active id is written to `html[data-theme]` and persisted under `wanderline-theme-v2`. A failed storage read or write falls back to the default appearance instead of breaking the picker.
- The picker is injected as a real dialog: `aria-haspopup`, `aria-expanded`, `aria-pressed` on every option, Escape and outside-click dismissal, and a visible current-appearance label.
- A `MutationObserver` recomputes the CSS conic-gradient rings after React re-renders, because those rings are painted from computed values rather than markup.
- The CSS itself is layered. Base sheets (`app-v2.css`, `showcase-design.css`) came first; the appearance stack loads after them: `night-map-theme.css` for the four palettes and the surface rules, `refinement.css` for the stat band and phone behaviour, and `polish.css` for spacing, type scale, and component finishing. The surface and finishing rules are scoped to `html[data-theme]` rather than to one id, so every appearance keeps the same layout and only the colour tokens change.

`!important` appears in the appearance layers where the original sheets hard-code light surfaces. That is a deliberate migration seam: the alternative was a risky rewrite of a 42 KB stylesheet in one pass.

## Component rules

- **Masthead.** 44px padding, serif trip name clamped 38–60px, amber primary action and an outlined secondary. The amber radial glow sits behind the action column, so the eye lands there first.
- **Stat band.** Four equal cells, 22px gutter above, inset rule under each value, 3px progress tracks. Labels are small caps, values are serif and tabular.
- **Day tabs.** 68px tall, 12px radius. The active day uses a sage gradient with dark text; the plan count stays readable at 9px. On phones the row becomes a horizontal scroller instead of wrapping into a wall of tabs.
- **Activity cards.** 18/20px padding, 15px radius, 21px serif title, a single hairline between title and notes, and the cost/time/map row aligned to the card's baseline.
- **Next-stop rows.** Dashed rules inset from the card edge read as route legs rather than table borders.
- **Saved places.** Artwork is 150px tall with a faint contour pattern, and three tint families rotate by `nth-child` (forest, amber, deep blue) so a wall of saved places stops looking like one repeated placeholder.
- **Avatars.** Sage-to-amber gradient with cream initials, ringed in the surface colour so stacked members separate cleanly.

## Responsive behaviour

The layout keeps its desktop hierarchy but reflows in steps, defined in `app-v2.css` and the appearance layers:

| Width | Behaviour |
| --- | --- |
| ≤ 1180px | 220px sidebar, two-column place grid, tighter itinerary aside |
| ≤ 920px | Off-canvas sidebar with backdrop, 2×2 stat band, two-column dashboard |
| ≤ 700px | Single column, 62px header, horizontal day tabs, stacked hero with two-up actions |
| ≤ 430px | Single-column stats, compact cards, 105px place artwork, full-width primary actions |

## Accessibility

- `color-scheme: dark` on every appearance, so native selects, scrollbars, and form controls do not flash white.
- Status is always written as a word (Planned, Confirmed, Suggested) as well as coloured.
- Visible keyboard focus comes from `accessibility.css`; icon-only controls carry `aria-label`s.
- `prefers-reduced-motion: reduce` disables transitions, animations, and smooth scrolling.
- Primary actions on the hero and phone controls stay at 44–46px, and the phone navigation has a labelled menu button.

## Verifying a design change

1. `npm run check` — typecheck both targets, build the client and server, verify artifacts.
2. Confirm the new rules landed in the built CSS (`dist/assets/index-*.css`), not just in source.
3. Review the four primary tabs at desktop width and the 700/430 breakpoints in a browser.
4. Re-check the appearance picker with the keyboard, and the page with reduced motion enabled.
