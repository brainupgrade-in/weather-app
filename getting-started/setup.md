# Workshop Setup Guide

This guide sets up the accelerated agent-driven SDLC used by the Weather App. The goal is to let Jira hold the work item, let GitHub Agentic Workflows coordinate implementation, and keep human involvement at pull request review and merge.

## 1. Prerequisites

Install and authenticate:

- Git
- Python 3.12
- GitHub CLI (`gh`)
- GitHub Copilot access for Agentic Workflows
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

Fork or clone the repository and enter it:

```bash
git clone https://github.com/brainupgrade-in/weather-app.git
cd weather-app
git switch main
git pull --ff-only origin main
```

Check that the workflow files exist:

```bash
find .github/workflows -maxdepth 1 -type f -print | sort
```

Important files include:

- `implement-agent-ready.md`: Copilot implementation workflow source
- `implement-agent-ready.lock.yml`: compiled workflow executed by Actions
- `jira-ready-dispatch.yml`: Jira-to-GitHub issue handoff
- `jira-pr-status.yml`: PR status and Jira completion update
- `spec-merged-dispatch.yml`: starts implementation after a specification PR merge
- `tests.yml`: required CI check
- `.vscode/mcp.json`: optional Atlassian MCP registration

## 3. Configure GitHub repository variables

In GitHub, open **Settings > Secrets and variables > Actions > Variables** and create:

| Name | Example value |
|---|---|
| `JIRA_SYNC_ENABLED` | `true` |
| `ATLASSIAN_SITE` | `https://your-site.atlassian.net` |
| `JIRA_PROJECT_KEY` | `WAPP` |
| `JIRA_ISSUE_TYPE` | `Task` |

For this workshop, the project key is `WAPP` and the project name is Weather App.

## 4. Configure GitHub secrets

In **Settings > Secrets and variables > Actions > Secrets**, create:

| Name | Value |
|---|---|
| `ATLASSIAN_USER_EMAIL` | Jira integration-account email |
| `ATLASSIAN_API_TOKEN` | Jira API token |

Use a dedicated integration account. Grant only the Jira permissions required to read issues, create issues, add comments, and transition issues. Never place these values in workflow YAML or documentation.

## 5. Configure GitHub permissions

In **Settings > Actions > General**:

- Allow GitHub Actions to create and approve pull requests.
- Keep workflow permissions at the repository policy required by the workflows.

The agent workflow is restricted to application and documentation paths. It cannot modify workflow files or credentials.

## 6. Protect the main branch

Configure **Settings > Branches > Add branch protection rule** for `main`:

- Require the `Tests / tests` status check.
- Require one approving review for normal contributors.
- Require conversation resolution.
- Dismiss stale approvals when new commits are pushed.
- Disable force pushes and branch deletion.
- Repository administrators may bypass the review requirement for a workshop repository when no collaborator is available.

The agent can create a draft PR, but it cannot merge the PR. A human reviews and merges the implementation.

## 7. Configure Jira

In Jira project `WAPP`:

1. Create issue types such as Story, Task, Bug, and Sub-task.
2. Ensure the project can use these statuses: `To Do`, `In Progress`, and `Done`.
3. Add labels such as `agent-ready` and `github-synced` if the project uses labels.
4. Create the Weather App board and backlog if they do not already exist.

The repository transitions Jira dynamically by status name, so the target statuses must be named exactly `In Progress` and `Done`.

## 8. Configure the Jira readiness webhook

Create a Jira Automation rule for project `WAPP`:

- Trigger: issue transitions to `Agent-ready`.
- Action: send a `POST` web request to:

```text
https://api.github.com/repos/YOUR_ORG/weather-app/dispatches
```

Headers:

```text
Accept: application/vnd.github+json
Authorization: Bearer YOUR_GITHUB_TOKEN
Content-Type: application/json
```

JSON body:

```json
{
  "event_type": "jira-ready-for-development",
  "client_payload": {
    "jira_key": "{{issue.key}}",
    "jira_url": "{{issue.url}}",
    "summary": "{{issue.summary}}",
    "description": "{{issue.description}}"
  }
}
```

Store the GitHub token in Jira Automation's secure storage. The token needs permission to dispatch workflows and the repository workflow needs permission to create issues. Do not place the token in Jira issue descriptions or Git.

The repository also contains a scheduled poller as a fallback. The webhook is the preferred trigger because it is immediate and avoids polling delay.

## 9. Configure optional Atlassian MCP

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

Use the VS Code MCP authentication prompt. MCP gives Copilot Jira context; it does not replace the Jira webhook, which is the event trigger.

## 10. Verify the setup

From the repository root:

```bash
git status --short --branch
gh aw compile implement-agent-ready
python3 -m pytest
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
- GitHub Actions variables and secrets are configured.
- Jira `WAPP` has the required statuses.
- Jira can send the repository dispatch request.
- `gh aw compile implement-agent-ready` succeeds.
- CI passes on a test branch.
- A test Jira issue can reach GitHub without exposing a secret.

For the repeatable feature workflow, continue with [building-features.md](building-features.md).
