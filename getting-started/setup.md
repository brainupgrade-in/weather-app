# Workshop Setup Guide

This guide sets up the accelerated agent-driven SDLC used by the Weather App. The goal is to let Jira hold the work item, let GitHub Agentic Workflows coordinate implementation, and keep human involvement at pull request review and merge.

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
- `jira-ready-dispatch.yml`: turns a new Jira issue into a GitHub issue and starts the implementation agent
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

## 9. Create the Jira Automation rule

Every issue created in `WAPP` is sent to GitHub the moment it is created, and starts the implementation agent. A Jira Automation rule sends the issue key to GitHub's repository dispatch API.

**Anyone who can create issues in `WAPP` can start the agent.** Limit the project's *Create issues* permission to the people who should be able to do that.

### Create a GitHub token for the rule

In GitHub, open **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**:

- **Resource owner:** the account or organisation that owns your copy of the repository.
- **Repository access:** *Only select repositories*, and pick only your `weather-app` copy.
- **Repository permissions:** **Contents: Read and write**. The dispatch API requires it; *Metadata: Read* is added automatically.
- **Expiration:** the length of the workshop.

Anyone who can edit the Jira rule can read this token, which is why it is limited to one repository and one permission.

### Create the rule

In Jira, open project `WAPP` > **Project settings > Automation > Create rule**:

1. **Trigger:** *Issue created*.
2. **Action:** *Send web request*:
   - **Web request URL:** `https://api.github.com/repos/OWNER/weather-app/dispatches`
   - **HTTP method:** `POST`
   - **Headers:**

     ```text
     Accept: application/vnd.github+json
     Authorization: Bearer <the token above>
     Content-Type: application/json
     ```

   - **Web request body:** *Custom data*:

     ```json
     {"event_type": "jira-ready-for-development", "client_payload": {"jira_key": "{{issue.key}}"}}
     ```

3. Name the rule, for example *Send new issues to GitHub*, and turn it on.

The rule sends only the key. `jira-ready-dispatch.yml` reads the summary and description from Jira with the `ATLASSIAN_*` secrets, so the issue text never has to be escaped into JSON. GitHub answers a successful dispatch with HTTP `204`, which the rule's **Audit log** shows.

- **Loop guard:** issues that `jira-sync.yml` creates from GitHub issues also fire the rule. The workflow recognises them by the `GitHub issue:` link in their description and skips them.
- **Free plan:** Jira Free allows a limited number of automation rule runs each month, and every created issue uses one. Check your usage before a workshop where many people create issues.

To test the GitHub side without Jira Automation, send the dispatch yourself for an existing Jira issue. This starts the agent, which consumes Copilot credits and opens a draft PR:

```bash
gh api repos/OWNER/weather-app/dispatches \
  --field event_type=jira-ready-for-development \
  --field "client_payload[jira_key]=WAPP-3"
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
- The Jira Automation rule is on, and its GitHub token can reach only your repository.
- `gh aw compile` succeeds with no errors.
- CI passes on a test branch.
- A small test issue created in Jira appears as a GitHub issue within a minute, and **Implement approved Jira work** starts for it.

For the repeatable feature workflow, continue with [building-features.md](building-features.md).
