# Temperature Unit Toggle

**Status:** Implemented (PR #14)
**Feature ID:** WAPP-002
**Owner:** Weather App maintainers
**Depends on:** [Weather Lookup](../001-weather-lookup/spec.md)

## Summary

Allow users to switch the displayed temperature between Celsius and Fahrenheit. The choice is kept in
`sessionStorage` for the current browser session. The weather API contract remains unchanged and continues to return
the provider's Celsius temperature.

## User story

As a person checking the weather, I want to choose Celsius or Fahrenheit so that the displayed temperature matches my
preferred unit.

## Scope

### In scope

- Show a Celsius/Fahrenheit toggle beside the displayed temperature.
- Use Celsius as the default when no session preference exists.
- Convert displayed temperature from Celsius to Fahrenheit with `F = C * 9 / 5 + 32`.
- Persist the selected unit in `sessionStorage`.
- Restore the selected unit when the page is revisited during the browser session.
- Keep the API response and provider requests unchanged.
- Keep the selected unit visible in the temperature display and accessible to keyboard and screen-reader users.

### Out of scope

- Changing the `/api/weather` response shape.
- Sending a unit parameter to Open-Meteo.
- Persisting preferences across browser sessions or user accounts.
- Wind-speed conversion.
- Multi-city comparison or geocoding-match selection.

## Functional requirements

### FR-001: Default Celsius

When no valid unit preference exists in `sessionStorage`, the page MUST display temperatures in Celsius.

### FR-002: Fahrenheit conversion

When Fahrenheit is selected, the page MUST display the equivalent rounded temperature using `C * 9 / 5 + 32`.

### FR-003: Unit selection

The page MUST provide an accessible control for selecting Celsius or Fahrenheit and MUST update the displayed result
without requiring a new provider request.

### FR-004: Session persistence

The page MUST save the selected unit in `sessionStorage` and restore it on page load when the stored value is `C` or
`F`. Invalid stored values MUST fall back to Celsius.

### FR-005: API stability

The API MUST continue returning the existing Celsius-based response shape, and changing the display unit MUST NOT
change the API request or response contract.

## Acceptance criteria

- [x] A fresh page displays Celsius by default.
- [x] Selecting Fahrenheit converts the current displayed temperature correctly.
- [x] Selecting Celsius converts the current displayed temperature back correctly.
- [x] The selected unit is saved and restored from `sessionStorage`.
- [x] Invalid or missing session values fall back to Celsius.
- [x] Switching units does not issue another weather-provider request.
- [x] The control is keyboard accessible and has an accessible name.
- [x] Existing weather lookup success, error, and loading behavior remains intact.
- [x] Automated tests cover conversion, persistence, and the unchanged API contract.

## References

- Previous feature: [Weather Lookup](../001-weather-lookup/spec.md)
- Repository implementation plan: [plan.md](plan.md)