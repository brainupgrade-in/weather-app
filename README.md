# Weather Vibes

Type any city and get its weather. The page takes on the colours of that city's sky. It is a single repo with
one endpoint, and it exists as the **"hello world" of GitHub Agentic Workflows (gh-aw)**: the first 15 minutes,
before any other demo.

> **Status: spec only.** The app itself already exists at `~/apps/weather` (Flask, Open-Meteo, no API key). Copy it
> in as the starting code. **Don't edit the original.** Then add what this README specifies with GitHub Copilot.

## What this demo shows

| gh-aw feature | Where it appears |
|---|---|
| The anatomy of a workflow: `on`, `permissions`, `safe-outputs`, then plain-English instructions | `issue-clarifier.md`, the 15-line workflow from the deck |
| Human–agent process | A vague issue gets a helpful question back within a minute |
| Writing workflows with the help of an agent | `daily-repo-status.md` is created **live** by prompting Copilot, not typed by hand |
| Markdown compiled to a normal Actions workflow | `gh aw compile` turns `.md` into `.lock.yml` |

## The story

The app is loved and small, so people file issues like *"it doesn't work"* and *"add better setup
instructions"*. The maintainer can't act on those without asking questions first. An agent asks the questions for
them. Then the maintainer wants a short daily note on what's happening in the repo, and instead of writing the
workflow by hand, asks Copilot to write it.

## App (existing, copy from `~/apps/weather`)

**Stack:** Python 3.12, Flask, requests, gunicorn. Vanilla JS and CSS. No database, no secrets.

```
app.py              # GET /  and  GET /api/weather?city=<name>  (Open-Meteo geocode + forecast)
templates/index.html
static/app.js       # sessionStorage cache (1-hour TTL), city chips, sky themes, particle canvas
static/style.css
NOTES.md            # design assumptions; keep it, and issue triage can cite it
Dockerfile
```

**Add** (the only code changes in this repo):

- `tests/test_api.py`: pytest with `requests` mocked, covering a known city (200), an unknown city (404), and an
  empty `city` parameter.
- `.github/workflows/tests.yml`: plain Actions running pytest.

## Seed issues

Open these by hand before the session. #1 and #2 are the ones the agent should ask about. #3 and #4 are clear and
should get only a short acknowledgement.

| # | Title / body | Why |
|---|---|---|
| 1 | *"Please add better setup instructions."* | The deck's own example. Vague: for which OS, and for Docker or local? |
| 2 | *"Weather is wrong for Springfield."* | Vague, and it's a real limitation: the first geocoding match wins (`NOTES.md` assumption 7). |
| 3 | *"Add a °C / °F toggle. Suggested: a button next to the temperature, remembered in sessionStorage."* | Clear. No questions needed. |
| 4 | *"Unknown city returns 404 but the page shows a blank card instead of the message."* | Clear bug report. |

## Agentic workflows

> The front-matter below is a **sketch**. gh-aw is in public preview and its syntax moves. Run `gh aw compile`
> and fix whatever it reports.

### `issue-clarifier.md`, the one from the deck, kept this short on purpose

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

**Keep it this short.** The point of the demo is that fifteen lines are enough. If rehearsal shows the agent
commenting on clear issues as well, add **one** sentence: "If the issue is already clear, reply with a single
line acknowledging it." Nothing more.

### `daily-repo-status.md`, written live by an agent

Don't pre-write this one. In the demo, open a Copilot agent session on the repo (the github.com agent panel or the
mobile app) and type:

> *Create a GitHub agentic workflow that runs every weekday morning and opens an issue summarising what
> happened in this repo in the last 24 hours: new issues, comments, merged PRs, and anything that looks stuck.
> Read-only permissions. The only write it may do is create that issue.*

Keep the version produced in rehearsal on a branch as a fallback. **Expected shape:** a weekday schedule plus
`workflow_dispatch`, read-only permissions, and `create-issue` as its only safe output with a title prefix.

## Live demo script

1. Run the app. Search Tokyo, then Reykjavik. Show `app.py`: *one file, 64 lines.* The room now knows the whole codebase.
2. Open `issue-clarifier.md`, walking the boxes from the deck: **When** (`on`), **Guardrails** (`permissions`,
   `safe-outputs`), **What** (the text below the front-matter).
3. Run `gh aw compile` and show the generated `.lock.yml`: *this is ordinary GitHub Actions underneath.*
4. Open seed issue #2 live. About a minute later, the agent's comment asks which Springfield (state, country).
5. Show that #3 got no questions.
6. Open the Copilot agent session and paste the `daily-repo-status` prompt. Review the PR it opens (the workflow
   file itself), merge it, dispatch it, and show the summary issue.
7. Bridge to the next demo: *that's the pattern. Next, the same idea in a real business app.*

## Acceptance criteria

- [ ] `python app.py` serves the page; `GET /api/weather?city=Pune` returns 200 with JSON; an unknown city returns 404.
- [ ] `pytest` passes with the network mocked, and `tests.yml` is green.
- [ ] `issue-clarifier.md` is under 20 lines and compiles; its `.lock.yml` is committed.
- [ ] On seed issues #1 and #2 the agent asks at least one specific question; on #3 it asks none.
- [ ] A rehearsal run of the live prompt produced a workflow that compiles, and it is saved on the branch `fallback/daily-repo-status`.

## Out of scope

Any change to the UI, caching or weather logic. This demo is about the workflow, not the app.

## Before the demo

- Install the CLI: `gh extensions install github/gh-aw`, then set up the Copilot engine's secret as `gh aw` documents.
- **Keep Open-Meteo's CC-BY attribution** in the README and footer if the repo goes public.
- This is the cheapest demo (a few runs), but still delete the rehearsal issues before the session.
