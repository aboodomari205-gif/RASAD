# Interaction audit

Scope: existing Earth, Atlas, Calendar and all eight mission-index destinations. Tests use actual Chrome/CDP (`scripts/verify-motion.mjs`) and an isolated credential-free Express/Vite pair; `scripts/verify-filters.mjs` gives a short FRP/network regression. Native DOM click/selection is distinguished from real keyboard input. See completion tracker for final run status. Unit/API results are not claimed as scientific validation.

| Control | Expected behavior | Test / result |
| --- | --- | --- |
| Earth Enter Mission | Camera push, renderer handoff, Ajloun default in fresh session | CDP exercised; original regression |
| Earth Skip / direct entry | Immediate user entry without asset gating | CDP exercised |
| Earth pause and arrow interaction | Toggle rotation, keyboard globe interaction | CDP click/key exercised |
| Return to Earth wordmark | Static replay when MapLibre retained; no second WebGL renderer | CDP canvas/lifecycle exercised |
| Intro texture/context/WebGL failure | Honest static fallback; recoverable mission error | CDP blocked asset/context loss/no-WebGL exercised |
| Index open/close/module selection | Preserve original navigation styling; active module, focus restoration | CDP every destination exercised; Escape behavior retained |
| Skip-to-workspace | Native anchor targets workspace | Manual keyboard review remains |
| Atlas region | Explicit fixture vs pilot; clear stale points/popups | CDP and API isolation exercised |
| Street / Satellite | Restore source, outline, filtered points after style change | CDP exercised |
| Fit area / Enter Mission camera | Cancellable fit to region/current fixture | CDP flight and zoom checks exercised |
| Zoom + / − / Reset north | Native MapLibre action; gestures interrupt camera | Focused CDP individually verifies zoom in/out and north reset; physical touch remains manual |
| Stop camera / gestures / Escape | Cancel flight and pending journey | CDP interruption exercised; physical pinch manual |
| Ledger toggle/close | Show inspector, active state, retain map | CDP exercised |
| Observation row / circle | Highlight, exact metadata, popup, focus into detail | CDP exercised; no source coordinate mutation |
| Inspector Back / list | Restore list/focus | Existing browser flow exercised |
| Show next observations | Extend bounded list by 50 | Implemented; local fixture has only 7, so >50-row browser case unexecuted |
| Sensor radio / all instruments | Sensor-appropriate records; unavailable instruments disabled | CDP and canonical unit tests exercised |
| Raw confidence select | Only selected sensor's original values; disabled for all | CDP exercised |
| UTC From/Through | Canonical inclusive date bounds; invalid range rejected visibly | Unit/API and focused DOM input/change-to-source synchronization passed; physical/native date-picker editing remains manual |
| Minimum / Maximum FRP | Inclusive MW bounds; missing FRP excluded; zero retained | Real CDP keyboard minimum input; min/max/invalid cases unit/API tested |
| Clear date/FRP bounds | Restore filtered source without map remount | CDP exercised |
| Date chips / All dates / scrubber | Filter actual acquisitions; custom range not mislabeled all | CDP discrete dates and slider exercised |
| Historical playback | Disabled with honest unavailable reason | Deliberately disabled; no fake playback |
| Atlas error Retry / reset filters / fixture discovery | Retry actual fetch or reset scope / explicit mode | CDP network failure/retry and region/filter flow exercised |
| Calendar region / sensor / metric | Same canonical data, retained scope, original sensor distinctions | CDP counts 2/4/1 and 23.54 MW, MODIS unavailable exercised |
| Calendar month/year / previous/next | Correct UTC dates and valid range | CDP exercised |
| Calendar cells / grid arrows / Enter | Select daily detail with real keyboard behavior | CDP ArrowRight/Enter exercised |
| Calendar metadata disclosure | Original field details | CDP exercised |
| Calendar shared-filter reset | Explicitly remove inherited date/quality exclusions | Focused CDP direct click restores all three fixture dates |
| Calendar selected-date Atlas handoff | Same region/sensor/date; same map instance; fresh cancellable fit | CDP exercised including resize while map hidden |
| Season primary-year select / available-year checkboxes | Restrict actual observed years; preserve each source series | CDP fixture year exercised; multi-real-year UI requires delivered archives (unit aggregation tested) |
| Season twelve month buttons | Select actual month inspector, pressed state | CDP all 12 present / November click and native Space activation; full keyboard traversal remains manual |
| Season Calendar / Atlas actions | Apply selected month through shared UTC scope | Full CDP Calendar handoff and focused month-to-Atlas/custom-range reset passed |
| Source chart / table month buttons | Select UTC month; separate scales, exact table values | Full CDP Sensor source-table month-to-Calendar handoff passed; every chart-bar click not individually exercised |
| Sensor compare-both | Show separate MODIS/VIIRS summaries and unknown absent sensor | CDP exercised |
| Sensor method disclosure | Explain resolution, confidence, timing, coverage and non-calibration | Full CDP native disclosure click and method identifier check passed; API comparison tested |
| Fire DNA provenance action | Go to Sensor Intelligence; fixture never qualifies | Unit gate tested; insufficient-data screen CDP exercised. Real multi-year rendered branch not browser-tested |
| Anomaly eligibility / method disclosure | Explain prerequisites; scoring unavailable | CDP disabled action and explanation; controlled synthetic unit checks |
| Brief CSV | Download actual filtered rows/provenance; safe quoting and formulas | CDP blob payload captured (7 rows + header); unit escaping/negative coordinates tested |
| Brief copy | Clipboard success or explicit select-and-copy fallback | CDP action exercises either honest supported result; OS clipboard permissions vary |
| Brief print/save | User-triggered print; readable report | CDP print action spy plus actual `Page.printToPDF`; OS dialogs/printer manual |
| Lab region/sensor/metric/date/clear | Shared mission scope and active values, error/empty/loading | CDP region/compare/clear/metric inheritance; unit filtering. Date widgets human editing check remains |
| Methodology links | Real primary NASA sources in new tab | URLs inspected against primary sources; external navigation not automated |
| Create brief / first available day | Preserve scope or apply actual acquisition to Atlas | Implemented; individual shortcut clicks human check remains |
| Module Back-to-Atlas / Earth | Return without map recreation | CDP retained canvas exercised |
| Hash navigation / refresh | Module direct navigation plus tab-session scope | Focused CDP Back/Forward and non-default Calendar refresh with session scope passed |
| All unavailable/error states | No fabricated statistics/verified zeros | Existing unit/API/CDP cases; no real archive coverage test is claimed |
| Oversized analysis range / reset | Recoverable view fallback, clear filters or return to Atlas | Focused CDP deliberately exceeds 40,000-day limit, sees fallback and successfully resets; expected range fault only |

The full browser harness records network failures and console-error event counts. Inspector-blocked requests, canceled tile/navigation requests and the deliberately blocked Earth texture/no-WebGL tests are explicitly classified. Normal-workflow unexpected exceptions/HTTP failures are asserted separately; a fallback fault is not falsely reported as an error-free normal request.

## Remaining human/device checks

Use desktop, 390px mobile and a physical touch device. Traverse all native inputs/buttons with Tab/Shift+Tab, activate month buttons with Space/Enter, inspect visible focus, verify screen-reader chart/table and status announcements, and test pinch/zoom/compass. Try rejected date/FRP ranges and storage-disabled/private browsing. Review saved CSV in a spreadsheet and print PDF pagination in a viewer. Check the real-data Fire DNA/multi-year paths only after genuine comparable history is delivered. Run [deployment acceptance](DEPLOYMENT.md) against the actual preview URL. These are not marked passed by compilation or DOM inspection.
