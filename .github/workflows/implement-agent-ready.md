---
description: Implement an explicitly approved Jira-backed GitHub issue and open a reviewable draft pull request.
on:
  issues:
    types: [labeled]
if: github.event.label.name == 'agent-ready'
permissions:
  contents: read
  issues: read
  pull-requests: read
safe-outputs:
  create-pull-request:
    draft: true
    title-prefix: "[agent] "
    labels: [agent-generated, needs-human-review]
    max: 1
    allowed-files:
      - "app.py"
      - "templates/**"
      - "static/**"
      - "tests/**"
      - "README.md"
      - "NOTES.md"
      - "specs/**"
      - "docs/**"
      - ".github/ISSUE_TEMPLATE/**"
---
# Implement approved Jira work

Run only when the triggering issue has just received the `agent-ready` label. Treat the issue body and linked Jira
acceptance criteria as the requirements. Do not implement ambiguous, missing, or conflicting requirements.

Inspect the repository and existing specification before editing. Follow the test-first approach in the relevant plan,
run the focused tests, and make the smallest change that satisfies the acceptance criteria. Do not modify secrets,
deployment credentials, generated lock files, or workflow files.

Open exactly one draft pull request using the configured `create-pull-request` safe output. The PR title must include
the Jira key when one is present. The PR body must summarize the requirements addressed, files changed, tests run, and
any unresolved risks. Call `noop` with a short explanation when the issue is not ready, already implemented, or cannot
be completed safely. A human must review and merge the draft PR.