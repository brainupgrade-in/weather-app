# Weather Lookup

**Status:** Implemented (PR #10)
**Feature ID:** WAPP-1
**Owner:** Weather App maintainers

## Summary

Provide a small web application that accepts a city name and displays current weather details retrieved from the Open-Meteo public APIs. The application is Python based, uses Flask for HTTP handling, and does not require an API key.

## User story

As a person checking the weather, I want to enter a city name and see its current weather so that I can quickly understand the conditions there.

## Scope

### In scope

- Serve a browser page from Flask at `GET /`.
- Accept a city through `GET /api/weather?city=<name>`.
- Geocode the city through Open-Meteo's geocoding endpoint.
- Use the first geocoding match, as documented in the current product assumption.
- Retrieve and return forecast/current-weather data for the selected location.
- Render a useful response for successful, unknown, and invalid searches.
- Keep Open-Meteo attribution in the README and page footer.
- Support local execution with Python 3.12 and production execution with Gunicorn.

### Out of scope

- User accounts, persistence, or a database.
- API keys or paid weather providers.
- Multi-city comparison.
- Changing the existing visual design, caching behavior, or weather interpretation without a separate specification.
- Selecting between multiple geocoding matches; the first match remains the initial product behavior.

## Functional requirements

### FR-001: Weather search page

The system MUST serve the weather search page from `GET /`.

The page MUST allow a user to enter a city and submit a search without manually constructing an API URL.

### FR-002: Successful lookup

Given a non-empty city that Open-Meteo can geocode, `GET /api/weather?city=<name>` MUST return HTTP `200` with JSON containing enough location and weather data for the page to display the result.

The response MUST identify the resolved city and location and include the current weather details returned by the provider.

### FR-003: Unknown city

Given a city that produces no geocoding result, the API MUST return HTTP `404` with a JSON error message. The page MUST show that the city could not be found rather than rendering an empty weather card.

### FR-004: Empty input

Given a missing or empty `city` query parameter, the API MUST return a client-error response, preferably HTTP `400`, with a JSON error message. The page MUST require a city before attempting a provider request.

### FR-005: Provider failure

If an Open-Meteo request fails or returns an unusable response, the API MUST return a server-error response with a safe, user-readable JSON error. It MUST NOT expose credentials, stack traces, or internal request details.

### FR-006: Client experience

The page SHOULD show a loading state while a lookup is in progress and a clear error state when a lookup fails.

The page MAY cache recent results in session storage for up to one hour, provided that cache behavior does not change the API contract or hide a newly requested city.

## Non-functional requirements

- Python 3.12 is the supported local runtime.
- Flask is the web framework; requests is used for outbound HTTP calls.
- The application MUST be testable without network access by mocking provider requests.
- The application MUST be runnable with `python app.py` locally and Gunicorn in deployment.
- Provider timeouts MUST be bounded so a request cannot wait indefinitely.
- Logs MUST be useful for diagnosis while excluding secrets and unnecessary provider payloads.
- The service MUST preserve Open-Meteo attribution in public-facing documentation and the page footer.

## API contract

### `GET /api/weather?city=<name>`

Success response shape:

```json
{
  "location": {
    "name": "Pune",
    "country": "India",
    "latitude": 18.52,
    "longitude": 73.86
  },
  "current": {
    "temperature": 24.5,
    "wind_speed": 8.1,
    "weather_code": 2
  }
}
```

The exact provider fields may vary, but the public response MUST remain stable enough for the browser client and tests to consume.

Error response shape:

```json
{
  "error": "City not found"
}
```

## Acceptance criteria

- [ ] A user can open `/`, enter a city, and see the resolved location and current weather.
- [ ] `GET /api/weather?city=Pune` returns `200` and valid JSON when provider responses are mocked.
- [ ] An unknown city returns `404` and a JSON error.
- [ ] A missing or empty city returns `400` and a JSON error without calling the provider.
- [ ] Provider failures return a safe error response and do not expose implementation details.
- [ ] Browser error states do not display a blank weather card.
- [ ] Tests pass without making live network requests.
- [ ] Open-Meteo attribution is present in the README and footer.

## Open questions

- Should the first release expose Celsius only, or should a temperature-unit toggle be specified separately?
- Should users be able to choose among multiple geocoding matches in a future feature?
- What exact current-weather fields should the UI display beyond temperature, weather description, and wind?

## Decision record

- The initial release uses the first geocoding result to keep the interaction simple. A multi-match selector requires a separate specification.
- The provider is Open-Meteo because the app requires no API key for this demo.
