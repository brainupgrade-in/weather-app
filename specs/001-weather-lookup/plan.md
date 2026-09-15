# Weather Lookup Implementation Plan

**Spec:** [spec.md](spec.md)
**Status:** Not started

## Phase 0: Baseline and verification

- [ ] Implement the Flask application in this repository according to `spec.md`.
- [ ] Verify the application exposes `/` and `/api/weather` as described by the specification.
- [ ] Confirm the provider request shape and current response fields against the approved API contract.
- [ ] Resolve any mismatch in `spec.md` before continuing implementation.

## Phase 1: API contract tests first

- [ ] Write failing pytest cases for a known city, using mocked provider requests.
- [ ] Write a failing test for an unknown city returning `404` and a JSON error.
- [ ] Write a failing test for a missing or empty city returning `400` without a provider call.
- [ ] Implement the minimum API behavior needed to make the tests pass.
- [ ] Add bounded provider timeouts and safe provider-error handling.

## Phase 2: Browser behavior and delivery

- [ ] Add or verify the browser success, loading, and error states.
- [ ] Verify that unknown-city errors do not leave an empty weather card.
- [ ] Preserve Open-Meteo attribution in the README and footer.
- [ ] Add the GitHub Actions pytest workflow.
- [ ] Run the local app and exercise the headline acceptance scenario manually.

## Test plan

### TDD-drivable tests

- Known city returns `200` and the expected public JSON fields.
- Unknown city returns `404` and `{"error": ...}`.
- Empty or missing city returns `400` and does not call the provider.
- Provider failure returns a safe `5xx` response.
- Provider requests are mocked; the test suite never depends on live Open-Meteo availability.

### Verification-after checks

- `python app.py` starts successfully.
- `GET /api/weather?city=Pune` works against a controlled or live provider response.
- Browser search displays a result and browser error states are readable.
- CI runs pytest successfully on a clean checkout.

## Risks

- **Provider response drift:** isolate provider parsing and test the public contract with representative fixtures.
- **Ambiguous city names:** document first-match behavior and keep multi-match selection out of this feature.
- **Network delays:** use bounded HTTP timeouts and a user-visible failure state.
- **Spec drift:** update `spec.md` before changing behavior, then update tests from the approved criteria.

## Progress log

- **2026-09-15:** Created the initial SDD specification and implementation plan from the repository README. No application code changed.
