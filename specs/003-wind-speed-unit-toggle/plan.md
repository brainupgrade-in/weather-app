# Wind Speed Unit Toggle Implementation Plan

**Spec:** [spec.md](spec.md)
**Status:** Implemented (PR TBD)

## Phase 0: Baseline

- [x] Inspect the existing temperature toggle and wind speed rendering in `static/app.js` and `templates/index.html`.
- [x] Confirm the API remains km/h-based and requires no changes.

## Phase 1: Client behavior

- [x] Add a wind speed unit label element beside the wind speed value in `templates/index.html`.
- [x] Add km/h-to-mph conversion logic in `static/app.js`.
- [x] Keep the raw km/h wind speed available so it can be re-converted whenever the unit toggle changes.
- [x] Update the wind speed display and label whenever the temperature unit changes, including on restore from
      `sessionStorage`.

## Phase 2: Verification

- [x] Add focused tests for wind speed conversion, label text, and restored-preference behavior.
- [x] Verify toggling after a successful lookup updates the wind speed without another fetch.
- [x] Run the complete test suite (`tests/test_unit_toggle.js`, `tests/test_api.py`).

## Risks

- Existing rendering only stores the Celsius temperature for re-conversion; the raw km/h wind speed must be tracked
  similarly.

## Progress log

- **2026-09-15:** Created the specification and plan from GitHub issue #18 / Jira WAPP-4.
- **2026-09-15:** Implemented wind speed unit conversion in `static/app.js` and `templates/index.html`, extended
  `tests/test_unit_toggle.js`, and verified the existing Python API suite is unaffected.
