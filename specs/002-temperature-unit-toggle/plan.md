# Temperature Unit Toggle Implementation Plan

**Spec:** [spec.md](spec.md)
**Status:** Ready for development

## Phase 0: Baseline

- [x] Inspect the existing temperature rendering and session-storage conventions.
- [x] Confirm the API remains Celsius-based and requires no changes.

## Phase 1: Client behavior

- [x] Add the accessible Celsius/Fahrenheit control beside the temperature.
- [x] Add conversion and display formatting logic.
- [x] Persist only valid `C` or `F` values in `sessionStorage`.
- [x] Restore the preference on page load without issuing a provider request.

## Phase 2: Verification

- [x] Add focused tests for conversion and invalid/missing preferences.
- [x] Verify toggling after a successful lookup updates the display without another fetch.
- [x] Verify loading and error states remain unchanged.
- [x] Run the complete test suite and CI.

## Risks

- Existing DOM rendering may need a small refactor so the raw Celsius value remains available for repeated conversion.
- Browser storage may be unavailable or contain invalid data; fallback behavior must remain Celsius.

## Progress log

- **2026-09-15:** Created the follow-up specification from the open unit-toggle question in WAPP-001.
- **2026-09-15:** Implemented the Celsius/Fahrenheit toggle in `static/app.js` and `templates/index.html`,
  added `tests/test_unit_toggle.js`, and verified the existing Python API suite is unaffected.