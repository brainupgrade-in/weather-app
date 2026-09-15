---
description: Implement an explicitly approved Jira-backed GitHub issue and open a reviewable draft pull request.
on:
  issues:
    types: [labeled]
  # jira-ready-dispatch.yml starts this workflow by dispatch: a label added with the built-in Actions token cannot
  # trigger another workflow, so the label alone would never start the agent.
  workflow_dispatch:
    inputs:
      issue_number:
        description: "GitHub issue number to implement"
        required: true
        type: string
  bots: ["github-actions[bot]"]
if: github.event_name == 'workflow_dispatch' || github.event.label.name == 'agent-ready'
concurrency:
  job-discriminator: ${{ github.event.issue.number || github.event.inputs.issue_number }}
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
    protected-files: allowed
    allowed-files:
      - "app.py"
      - "Dockerfile"
      - "requirements.txt"
      - "templates/**"
      - "static/**"
      - "tests/**"
      - "README.md"
      - "NOTES.md"
      - "specs/**"
      - "docs/**"
      - ".github/ISSUE_TEMPLATE/**"
network:
  allowed:
    - defaults
    - python
---
# Implement approved Jira work

Implement GitHub issue #${{ github.event.issue.number || github.event.inputs.issue_number }}. Read that issue first. If
it is closed or does not carry the `agent-ready` label, call `noop` and stop.

Treat the issue body and linked Jira acceptance criteria as the requirements. Do not implement ambiguous, missing, or
conflicting requirements.

Inspect the repository and existing specification before editing. Follow the test-first approach in the relevant plan,
run the focused tests, and make the smallest change that satisfies the acceptance criteria. Do not modify secrets,
deployment credentials, generated lock files, or workflow files.

Open exactly one draft pull request using the configured `create-pull-request` safe output. The PR title must include
the Jira key when one is present. The PR body must start with `Closes #<issue number>`, then summarize the requirements
addressed, files changed, tests run, and any unresolved risks. Call `noop` with a short explanation when the issue is
not ready, already implemented, or cannot be completed safely. A human must review and merge the draft PR.
