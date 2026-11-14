# FIREPULSE / Mission Atlas V1

## Current screen

The mission workspace is rebuilt as a continuous cartographic composition rather than a sidebar dashboard. An edge-to-edge MapLibre viewport carries an editorial study-area title, an indexed masthead, a compact floating tool spine, a contextual observation ledger and a bottom temporal ruler. The cinematic Earth landing and its renderer-safe handoff remain in place.

The masthead exposes region, acquisition window and source provenance. At compact widths, provenance also appears beneath the identity and in the ledger. The mission index replaces the navigation rail and keeps existing Overview, Activity Calendar, Fire DNA, Anomaly Detection and methodology previews reachable. Unvalidated analysis remains explicitly unavailable.

## Source checkpoint and safety

Before implementation, source, scripts, manifests and configuration were copied to `.checkpoints/mission-atlas-20261111-191154/`. This source-only checkpoint excludes backend files, secrets, `.env`, observation datasets and dependencies. The checkpoint directory remains ignored. No backend contracts, processors, NASA endpoints, datasets, secrets, or Earth image assets were changed. No Git commit was made. No new dependency was installed.

## Reusable system

- `src/design/atlas-tokens.css`: Void #0B0D10, thermal coral #FF6848, mineral ivory #EAE8E2, signal cyan #7BCAD1; graphite surfaces; typography, spacing, rule, radius and control-size tokens.
- `src/design/AtlasPrimitives.tsx`: original stroked orbital, satellite, source-control, geographic framing and ledger glyphs; labeled map tools and region stamps. No stock icon package.
- `src/design/atlas.css`: screen composition and responsive states, editorial ledger, filter disclosure, temporal ruler, popup and native MapLibre controls.
- `AtlasInspector`: shared collection/detail state, exact sensor-specific counts, paginated source records, empty/loading/error states and scientific caveats.
- `AtlasFilters`: native radio groups and confidence controls with contextual explanation and focus handling.
- `AtlasTimeline`: actual-date buttons and a keyboard-accessible discrete range scrubber. A tick is an acquisition index, not a fabricated daily history or activity chart.
- `MissionUI`: compact index disclosure, honest module previews, and reusable metadata definition list.

The default view remains Ajloun pilot. Brazil must be explicitly selected and remains labeled **local development fixture / not live**. Thermal detections are not confirmed fires. VIIRS and MODIS have distinct styling and counts; unavailable sensors are disabled rather than given invented values. Confidence filtering becomes available only after selecting one instrument, preserving that instrument's original confidence values.

## Working controls

- Identity: return to the Earth scene while keeping the current mission/map alive.
- Index: navigate modules; unavailable scientific analyses explain their current limitations.
- Region selector: switch explicitly between Ajloun pilot and Brazil test fixture. A region change clears source points, popup, selection and all filters before the next response.
- Source-control glyph: open instrument/first-party confidence filters. Radios retain normal keyboard behavior. Escape/Close returns focus to the opener.
- Framing glyph: fit the current region or currently filtered observations. Camera framing accounts for the ledger and responsive viewport. Previous padding is cleared before each fit so repeated/responsive fits do not accumulate padding.
- Plus/minus/north: zoom and reset bearing. User input, Escape and Stop camera cancel the current journey.
- Ledger glyph: open/close the contextual inspector; it starts collapsed on a fresh mobile view and collapses on entry into the narrow layout.
- Satellite/Street: actual basemap switching with overlay restoration. Source credits and dynamic metric scale remain available.
- Date buttons/range: filter the real dataset by actual acquisition dates. All dates restores the collection subject to other active filters. Historical playback stays disabled.
- Map signal/ledger row: open a safe text-based metadata popup and field record. The selected signal is outlined. Back returns to the collection. The ledger's long metadata and records scroll independently.

Loading shows a source-reading state, without artificial progress. Errors expose a retry action and open the recovery ledger. Zero matching records can reset filters. Empty Ajloun data is explicitly described as unconnected, not evidence of no thermal activity.

## Map behavior preserved and corrected

The worker URL and one-time MapLibre creation remain intact. No panel, source filter, date change or module selection reinitializes the map. Feature coordinates and source metadata are untouched. Existing finite signal reveal and user-cancellable camera journeys remain active.

Browser checks exposed a pre-existing boundary race: `isStyleLoaded()` can remain false while raster tiles are pending after the first `style.load` event. Boundary restoration now uses the existence of the registered observation source to recognize a parsed style, so a late boundary response cannot miss its initialization window. Style swaps still rebuild all overlays from current data.

## Rendered design review

Actual isolated Chrome renders were inspected at 1440 × 1000, 900 × 900, and 390 × 844. Ajloun, Brazil, filters, selected record and popup, and mobile composition were reviewed. Iterations improved provenance readability, replaced the native slider appearance with a discrete cartographic ruler, prevented the desktop ledger from crowding narrow layouts, corrected responsive fit padding and moved the popup clear of the timeline. The final composition uses a continuous map, editorial hierarchy, original glyphs and rule-based disclosures; it does not use a card grid, permanent application sidebar or ordinary tab bar.

`node scripts/verify-motion.mjs` now checks Earth entry/skip and fallback behavior, initial Ajloun isolation, seven Brazil observations, source rendering, tablet framing, sensor availability, raw-confidence filtering, actual-date scrubbing (including the final fixture date with one observation), first-date filtering (two observations), popup/metadata/focus, camera interruption, basemap overlay restoration, mobile width/framing, map-instance retention, mission-index/unavailable-analysis disclosure, and API error/retry recovery. Screenshot artifacts are written only to the system temporary directory.

Run `npm run build`, `npm run lint`, `node --test server/observations.test.js`, and the browser check above. Vite still reports large lazy renderer/map chunks. The browser script is intended for the available Windows Chrome/Node environment.

## Manual checks

1. Enter from Earth normally and by Skip. Confirm Ajloun is the initial region, its polygon is visible, and unconnected observations are clearly identified.
2. Explicitly switch to Brazil; verify test/not-live labels and sensor provenance. Inspect the real points, hover state, source metadata, UTC acquisition, original confidence and FRP.
3. Open source controls; select VIIRS and its original confidence value. Confirm MODIS is disabled when absent. Combine date/sensor/confidence filters and use reset when appropriate.
4. Click each acquisition date and scrub with arrow/Home/End keys. Map points, ledger records and exact sensor counts must agree. Historical playback remains unavailable.
5. Select a row and a map point. Inspect the popup and ledger, scroll the metadata, use Back, and close/reopen the inspector with keyboard focus preserved.
6. Switch Street/Satellite while filtered; the correct points and Ajloun boundary must return. Refit, zoom, reset north and interrupt a camera movement with drag, wheel, Escape and Stop.
7. Open Index and Fire DNA/Anomaly Detection; confirm the explicit unavailable state, then return without losing the map or filter selection. Return to Earth and reenter the same mission.
8. Check desktop/tablet/mobile, portrait/landscape and browser zoom. Ledger and filter panels must scroll; the small view must not overflow horizontally; attribution and scientific caveats must remain available. Verify a physical touch device and screen reader separately.
9. Enable reduced motion before entry and during use. Confirm direct/static Earth entry, immediate camera placement and no spatial panel motion.

Remaining manual work: physical touch-device testing, assistive technology, broad browser coverage and low-end GPU profiling. Remote imagery/font availability still depends on connectivity. No validated historical baseline or live Ajloun observation collection is introduced.
