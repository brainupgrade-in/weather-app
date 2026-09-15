# Temperature Unit Toggle Implementation Plan

**Spec:** [spec.md](spec.md)
**Status:** Ready for development

## Phase 0: Baseline

- [ ] Inspect the existing temperature rendering and session-storage conventions.
- [ ] Confirm the API remains Celsius-based and requires no changes.

## Phase 1: Client behavior

- [ ] Add the accessible Celsius/Fahrenheit control beside the temperature.
- [ ] Add conversion and display formatting logic.
- [ ] Persist only valid `C` or `F` values in `sessionStorage`.
- [ ] Restore the preference on page load without issuing a provider request.

## Phase 2: Verification

- [ ] Add focused tests for conversion and invalid/missing preferences.
- [ ] Verify toggling after a successful lookup updates the display without another fetch.
- [ ] Verify loading and error states remain unchanged.
- [ ] Run the complete test suite and CI.

## Risks

- Existing DOM rendering may need a small refactor so the raw Celsius value remains available for repeated conversion.
- Browser storage may be unavailable or contain invalid data; fallback behavior must remain Celsius.

## Progress log

- **2026-09-15:** Created the follow-up specification from the open unit-toggle question in WAPP-001.