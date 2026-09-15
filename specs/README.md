# Specifications

- [001 Weather Lookup](001-weather-lookup/spec.md)
- [002 Temperature Unit Toggle](002-temperature-unit-toggle/spec.md)

This directory contains the product and engineering specifications for the Weather App. The implementation agent
writes each one from its Jira issue, in the same pull request as the code, and it is reviewed with that pull request.

## Spec-driven workflow

The agent follows these steps; follow them too when writing or editing a specification by hand.

1. Create or update a numbered feature directory.
2. Write the user behavior, constraints, acceptance criteria, and open questions in `spec.md`.
3. Resolve ambiguity before implementation. Record decisions in the spec or an ADR.
4. Track implementation and verification work in `plan.md`.
5. Write failing tests from the acceptance criteria before implementation.
6. Implement the smallest change that makes the tests pass, then run the full verification suite.

Feature directories use the format `<number>-<short-name>`, for example `001-weather-lookup`.
