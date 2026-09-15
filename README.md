# Weather App

Type any city and get its weather. The page takes on the colours of that city's sky. This repository contains the
standalone Weather App and its GitHub Agentic Workflows automation.

> **Status: Weather Lookup (WAPP-001) implemented.** See `app.py`, `templates/index.html`, `static/`, and
> `tests/test_api.py`, built from the approved specification in `specs/001-weather-lookup/spec.md`.

Weather data is provided by [Open-Meteo](https://open-meteo.com/), used under the [CC-BY 4.0
license](https://open-meteo.com/en/license).

## Workshop guides

- [Set up the accelerated agent-driven SDLC](getting-started/setup.md)
- [Build features with Jira, GitHub, and Copilot](getting-started/building-features.md)

## What this demo shows

| gh-aw feature | Where it appears |
|---|---|
| The anatomy of a workflow: `on`, `permissions`, `safe-outputs`, then plain-English instructions | `issue-clarifier.md` |
| Human–agent process | A vague issue gets a helpful question back within a minute |
| Writing workflows with the help of an agent | `daily-repo-status.md` is created **live** by prompting Copilot, not typed by hand |
| Markdown compiled to a normal Actions workflow | `gh aw compile` turns `.md` into `.lock.yml` |

## Product context

The app is loved and small, so people file issues like *"it doesn't work"* and *"add better setup
instructions"*. The maintainer can't act on those without asking questions first. An agent asks the questions for
them. Then the maintainer wants a short daily note on what's happening in the repo, and instead of writing the
workflow by hand, asks Copilot to write it.

## Application

**Stack:** Python 3.12, Flask, requests, gunicorn. Vanilla JS and CSS. No database, no secrets.

```
app.py              # GET /  and  GET /api/weather?city=<name>  (Open-Meteo geocode + forecast)
templates/index.html
static/app.js       # sessionStorage cache (1-hour TTL), city chips, sky themes, particle canvas
static/style.css
NOTES.md            # design assumptions; keep it, and issue triage can cite it
Dockerfile
```

**Implementation requirements:**

- `tests/test_api.py`: pytest with `requests` mocked, covering a known city (200), an unknown city (404), and an
  empty `city` parameter.
- `.github/workflows/tests.yml`: plain Actions running pytest.

## Example issues

These examples exercise the issue clarifier. #1 and #2 require clarification. #3 and #4 are clear and should get
only a short acknowledgement.

| # | Title / body | Why |
|---|---|---|
| 1 | *"Please add better setup instructions."* | The deck's own example. Vague: for which OS, and for Docker or local? |
| 2 | *"Weather is wrong for Springfield."* | Vague, and it's a real limitation: the first geocoding match wins (`NOTES.md` assumption 7). |
| 3 | *"Add a °C / °F toggle. Suggested: a button next to the temperature, remembered in sessionStorage."* | Clear. No questions needed. |
| 4 | *"Unknown city returns 404 but the page shows a blank card instead of the message."* | Clear bug report. |

## GitHub Agentic Workflows

> The front matter below is the source for the checked-in workflow. Run `gh aw compile` after changing it and fix
> any compiler errors.

### `issue-clarifier.md`

```markdown
---
on:
  issues:
    types: [opened]
permissions: read-all
safe-outputs:
  add-comment:
---
# Issue Clarifier

Analyze the current issue and ask for additional details if the issue is unclear.
```

Keep this workflow concise. If the agent comments on clear issues, add one sentence instructing it to acknowledge
them in a single line.

### `daily-repo-status.md`

Create this workflow through a Copilot agent session by requesting:

> *Create a GitHub agentic workflow that runs every weekday morning and opens an issue summarising what
> happened in this repo in the last 24 hours: new issues, comments, merged PRs, and anything that looks stuck.
> Read-only permissions. The only write it may do is create that issue.*

The expected result is a weekday schedule plus `workflow_dispatch`, read-only permissions, and `create-issue` as
its only safe output with a title prefix.

## Development workflow

1. Run the app and search for representative cities such as Tokyo and Reykjavik.
2. Review `issue-clarifier.md`: **When** (`on`), **Guardrails** (`permissions`, `safe-outputs`), and **What** (the
  instructions below the front matter).
3. Run `gh aw compile` and show the generated `.lock.yml`: *this is ordinary GitHub Actions underneath.*
4. Open example issue #2. The agent should ask which Springfield (state, country).
5. Show that #3 got no questions.
6. Open a Copilot agent session and provide the `daily-repo-status` request. Review the workflow change, merge it,
  dispatch it, and inspect the summary issue.

## Acceptance criteria

- [ ] `python app.py` serves the page; `GET /api/weather?city=Pune` returns 200 with JSON; an unknown city returns 404.
- [ ] `pytest` passes with the network mocked, and `tests.yml` is green.
- [ ] `issue-clarifier.md` is under 20 lines and compiles; its `.lock.yml` is committed.
- [ ] On seed issues #1 and #2 the agent asks at least one specific question; on #3 it asks none.
- [ ] A rehearsal run of the live prompt produced a workflow that compiles, and it is saved on the branch `fallback/daily-repo-status`.

## Out of scope

Any change to the UI, caching or weather logic. This demo is about the workflow, not the app.

## Setup

- Install the CLI: `gh extensions install github/gh-aw`, then set up the Copilot engine's secret as `gh aw` documents.
- Configure Jira using [docs/JIRA-INTEGRATION.md](docs/JIRA-INTEGRATION.md). Jira sync is disabled until the repository
  variable `JIRA_SYNC_ENABLED` is set to `true`.
- The full approved-work path is documented in [docs/AGENT-DELIVERY-PLAN.md](docs/AGENT-DELIVERY-PLAN.md): Jira readiness
  creates a GitHub issue, and the `agent-ready` label authorizes a draft PR from the implementation agent.
- **Keep Open-Meteo's CC-BY attribution** in the README and footer if the repo goes public.
- Remove temporary example issues when they are no longer needed.
