# Workshop Setup Guide

This guide sets up the accelerated agent-driven SDLC used by the Weather App. The goal is to let Jira hold the work item, let GitHub Agentic Workflows coordinate implementation, and keep human involvement at specification review, pull request review, and merge.

## 1. Prerequisites

Install and authenticate:

- Git
- Python 3.12
- Node.js 22 (runs the JavaScript tests)
- GitHub CLI (`gh`)
- A GitHub account with a Copilot licence (the implementation agent runs on Copilot)
- A Jira Cloud account with project-administrator access
- VS Code with GitHub Copilot

Authenticate GitHub CLI:

```bash
gh auth login
gh auth status
```

Install GitHub Agentic Workflows:

```bash
gh extension install github/gh-aw
```

Do not commit `.env` files, API tokens, passwords, or personal access tokens.

## 2. Copy the repository

Clone the repository into a repository you administer and enter it:

```bash
git clone https://github.com/brainupgrade-in/weather-app.git
cd weather-app
git switch main
git pull --ff-only origin main
```

A fork also works, but it inherits none of the variables, secrets, or settings below. Configure every section in your own copy.

Check that the workflow files exist:

```bash
find .github/workflows -maxdepth 1 -type f -print | sort
```

Important files include:

- `implement-agent-ready.md`: Copilot implementation workflow source
- `implement-agent-ready.lock.yml`: compiled workflow executed by Actions
- `spec-merged-dispatch.yml`: starts implementation after a specification PR merge
- `jira-ready-dispatch.yml`: creates the GitHub issue and starts the implementation agent
- `jira-pr-status.yml`: reports PRs to Jira and marks the feature Done
- `jira-sync.yml`: creates a Jira issue for each newly opened GitHub issue
- `tests.yml`: required CI check (pytest and JavaScript tests)
- `.vscode/mcp.json`: optional Atlassian MCP registration

## 3. Configure GitHub repository variables

In GitHub, open **Settings > Secrets and variables > Actions > Variables** and create:

| Name | Example value |
|---|---|
| `JIRA_SYNC_ENABLED` | `true` |
| `ATLASSIAN_SITE` | `https://your-site.atlassian.net` |
| `JIRA_PROJECT_KEY` | `WAPP` |
| `JIRA_ISSUE_TYPE` | `Task` |

For this workshop, the project key is `WAPP` and the project name is Weather App. The Jira workflows do nothing until `JIRA_SYNC_ENABLED` is `true`.

## 4. Configure GitHub secrets

In **Settings > Secrets and variables > Actions > Secrets**, create:

| Name | Value |
|---|---|
| `COPILOT_GITHUB_TOKEN` | Token the implementation agent uses to call Copilot. Without it, every agent run fails at the secret check. |
| `ATLASSIAN_USER_EMAIL` | Jira integration-account email |
| `ATLASSIAN_API_TOKEN` | Jira API token |

For `COPILOT_GITHUB_TOKEN`, run `gh aw secrets bootstrap` from the repository root; it detects the secrets the workflows need and walks you through creating them. The token requirements are documented at <https://github.github.com/gh-aw/reference/engines/#github-copilot-default>.

For Jira, use a dedicated integration account. Grant only the Jira permissions required to read issues, create issues, add comments, and transition issues. Never place these values in workflow YAML or documentation.

## 5. Create the labels

The workflows apply these labels and fail if they do not exist:

```bash
gh label create agent-ready        --color 0E8A16 --description "Approved for the implementation agent" --force
gh label create jira-synced        --color 1D76DB --description "Linked to a Jira issue" --force
gh label create agent-generated    --color 5319E7 --description "Opened by an agent" --force
gh label create needs-human-review --color D93F0B --description "Waiting for human review" --force
gh label create needs-triage       --color FBCA04 --description "New issue awaiting triage" --force
```

## 6. Configure GitHub permissions

In **Settings > Actions > General**:

- Allow GitHub Actions to create and approve pull requests.
- Keep workflow permissions at the repository policy required by the workflows.

The agent workflow is restricted to application and documentation paths. It cannot modify workflow files or credentials.

## 7. Protect the main branch

Configure **Settings > Branches > Add branch protection rule** for `main`:

- Require the `Tests / tests` status check.
- Require one approving review for normal contributors.
- Require conversation resolution.
- Dismiss stale approvals when new commits are pushed.
- Disable force pushes and branch deletion.
- Repository administrators may bypass the review requirement for a workshop repository when no collaborator is available. If you bypass it in front of participants, say so: the review is the safety gate the workshop teaches.

The agent can create a draft PR, but it cannot merge the PR. A human reviews and merges the implementation.

## 8. Configure Jira

In Jira project `WAPP`:

1. Create issue types such as Story, Task, Bug, and Sub-task.
2. Ensure the project's workflow has statuses named exactly `To Do`, `In Progress`, and `Done`.
3. Create the Weather App board and backlog if they do not already exist.

The repository transitions Jira by status name, so `In Progress` and `Done` must match exactly, including capitalisation. No other status is required.

## 9. How work reaches the agent

No Jira Automation rule or webhook is needed. Implementation starts when a human merges a specification PR:

1. `spec-merged-dispatch.yml` checks that the merged PR is a specification PR: its title starts with `[WAPP-<number>]` and it changes only files under `specs/`.
2. It reads that Jira issue and sends a `jira-ready-for-development` repository dispatch.
3. `jira-ready-dispatch.yml` creates the GitHub issue, starts `Implement approved Jira work` for it, and moves Jira to `In Progress`.

The details and troubleshooting are in [building-features.md](building-features.md).

To test the handoff without a specification PR, send the dispatch yourself. This starts the agent, which consumes Copilot credits and opens a draft PR:

```bash
gh api repos/OWNER/weather-app/dispatches \
  --field event_type=jira-ready-for-development \
  --field "client_payload[jira_key]=WAPP-3" \
  --field "client_payload[jira_url]=https://your-site.atlassian.net/browse/WAPP-3" \
  --field "client_payload[summary]=Short feature name" \
  --field "client_payload[description]=Acceptance criteria"
```

## 10. Configure optional Atlassian MCP

The repository registers Atlassian MCP in `.vscode/mcp.json`:

```json
{
  "servers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

Use the VS Code MCP authentication prompt. MCP gives Copilot Jira context in your editor; it does not start any workflow.

## 11. Verify the setup

From the repository root:

```bash
git status --short --branch
gh aw compile
python3 -m pytest
node --test tests/test_*.js
```

If dependencies are missing, create a virtual environment and install them:

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt pytest
python -m pytest
```

Then verify GitHub branch protection and Actions permissions in the repository settings. Do not test with a production Jira issue first; use a small workshop Story.

## Setup success criteria

You are ready when:

- `main` is current and protected.
- GitHub Actions variables and the three secrets, including `COPILOT_GITHUB_TOKEN`, are configured.
- The five labels exist.
- Jira `WAPP` has the statuses `To Do`, `In Progress`, and `Done`.
- `gh aw compile` succeeds with no errors.
- CI passes on a test branch.
- A test GitHub issue creates a linked Jira issue without exposing a secret.

For the repeatable feature workflow, continue with [building-features.md](building-features.md).
