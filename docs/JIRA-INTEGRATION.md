# Jira Integration

This repository uses Jira for requirements and delivery status, and GitHub for source code, pull requests,
Actions, and GitHub Agentic Workflows.

## Jira project setup

Create a Jira project with:

- Key: `KAN` (the current repository variable value).
- Issue types: Story, Task, Bug, and Sub-task.
- Workflow: `Backlog -> Needs clarification -> Ready for development -> Agent-ready -> In progress -> In review -> Validation -> Done`.
- Required fields: summary, description, acceptance criteria, priority, assignee, and labels.
- Labels: `agent-generated`, `needs-human-review`, `blocked`, and `github-synced`.
- Components such as `API`, `Browser`, `CI`, and `Agentic workflows`.

Use Jira issue keys in branch names, commits, and pull request titles, for example `KAN-123-weather-api`.

## GitHub repository setup

Create these repository variables:

| Variable | Example | Purpose |
|---|---|---|
| `JIRA_SYNC_ENABLED` | `true` | Enables issue creation from newly opened GitHub issues |
| `ATLASSIAN_SITE` | `https://example.atlassian.net` | Jira Cloud site URL, without a trailing slash |
| `JIRA_PROJECT_KEY` | `WAPP` | Jira project key |
| `JIRA_ISSUE_TYPE` | `Task` | Jira issue type created by the sync workflow |

Create these repository secrets:

| Secret | Value |
|---|---|
| `ATLASSIAN_USER_EMAIL` | Email of the Jira integration account |
| `ATLASSIAN_API_TOKEN` | API token for that account |

Use a dedicated Jira integration account with only the permissions needed to create issues and add comments.
Never commit the token, Jira URL with credentials, or exported Jira data.

The workflow in `.github/workflows/jira-sync.yml` creates one Jira issue for each newly opened GitHub issue and
adds a link to the Jira issue back to GitHub. It is disabled until `JIRA_SYNC_ENABLED` is set to `true`.

The complete Jira-to-agent-to-PR flow is documented in [docs/AGENT-DELIVERY-PLAN.md](AGENT-DELIVERY-PLAN.md).
Jira should dispatch work only when an issue reaches `Agent-ready`; the GitHub dispatch workflow applies the
`agent-ready` label automatically.

## Agent and delivery conventions

- Jira is the source of truth for requirement, priority, ownership, and delivery status.
- GitHub is the source of truth for code, review, CI, and agent workflow execution.
- Agents may clarify issues, draft specifications, create task breakdowns, and post summaries.
- Humans approve scope changes, priority changes, merges, releases, and issue closure.
- Every Jira story should link to its specification, implementation pull request, and CI result.
- Do not let an agent transition a Jira issue to `Done` without a merged pull request and passing CI.
- Include the Jira key in the pull request title so `jira-pr-status.yml` can report the PR event back to Jira.

## First setup check

Open a test GitHub issue after configuring the variables and secrets. Confirm that:

1. A Jira issue is created in the configured project.
2. The Jira issue contains the GitHub issue link.
3. The GitHub issue receives a Jira link comment.
4. The existing issue clarifier can still ask questions without changing Jira credentials or code.