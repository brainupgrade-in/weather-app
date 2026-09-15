# Wind Speed Unit Toggle

**Status:** Implemented
**Feature ID:** WAPP-004
**Owner:** Weather App maintainers
**Depends on:** [Temperature Unit Toggle](../002-temperature-unit-toggle/spec.md)

## Summary

Extend the existing Celsius/Fahrenheit toggle so it also switches the displayed wind speed between km/h and mph. The
API keeps returning km/h; conversion happens in the browser, exactly like the existing temperature conversion.

## User story

As a person who prefers imperial units, I want the wind speed shown in mph when I select Fahrenheit, so that both
measurements on the page use the same system.

## Scope

### In scope

- With Celsius selected, show wind speed in km/h exactly as today.
- With Fahrenheit selected, show wind speed in mph, converted with `mph = km/h * 0.621371`, rounded to one decimal
  place.
- Update the unit label next to the wind speed to read `km/h` or `mph` to match the selected unit.
- Update the wind speed display when the unit toggle changes, without another `/api/weather` request.
- Restore a unit saved in `sessionStorage` on page load and apply it to the wind speed too.
- Keep the `/api/weather` response shape unchanged.

### Out of scope

- A separate wind unit control.
- Other units such as m/s or knots.
- Any change to the Open-Meteo request.

## Functional requirements

### FR-001: Celsius wind speed display

When Celsius is selected, the page MUST display the wind speed in km/h using the value returned by the API, with a
label of `km/h`.

### FR-002: Fahrenheit wind speed conversion

When Fahrenheit is selected, the page MUST display the wind speed converted to mph using `mph = km/h * 0.621371`,
rounded to one decimal place, with a label of `mph`.

### FR-003: Shared unit toggle

Switching the existing Celsius/Fahrenheit control MUST update both the temperature and the wind speed display
without issuing another provider request.

### FR-004: Session persistence

The unit preference restored from `sessionStorage` on page load (per FR-004 of the temperature unit toggle) MUST
also determine the initial wind speed unit and label.

### FR-005: API stability

The `/api/weather` response shape MUST remain unchanged.

## Acceptance criteria

- [x] With Celsius selected, wind speed is shown in km/h exactly as today.
- [x] With Fahrenheit selected, wind speed is shown in mph, converted with `mph = km/h * 0.621371` and rounded to one
      decimal place.
- [x] The unit label next to the wind speed reads `km/h` or `mph` to match the selected unit.
- [x] Switching the unit updates the wind speed without another `/api/weather` request.
- [x] A unit restored from `sessionStorage` on page load applies to the wind speed too.
- [x] The `/api/weather` response shape is unchanged.
- [x] Automated tests cover the conversion, the label, and the restored preference.

## References

- Previous feature: [Temperature Unit Toggle](../002-temperature-unit-toggle/spec.md)
- Repository implementation plan: [plan.md](plan.md)
- Jira issue: [WAPP-4](https://devopsai-38054231.atlassian.net/browse/WAPP-4)
- GitHub issue: #18
