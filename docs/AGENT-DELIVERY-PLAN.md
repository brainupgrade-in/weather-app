# Agent Delivery Plan

## Headline scenario

When a Jira issue reaches `Agent-ready`, Jira Automation sends a `repository_dispatch` event. GitHub creates a linked
issue with the `agent-ready` label. The Copilot agent implements the change, runs focused tests, and opens one draft
pull request. Human approval is required only for PR review and merge.

## Repository flow

1. Jira Automation sends a `jira-ready-for-development` repository event when the issue reaches `Agent-ready`.
2. `jira-ready-dispatch.yml` creates a GitHub issue with the `agent-ready` label.
3. `implement-agent-ready.md` reads the issue and repository specification.
4. The agent uses the restricted `create-pull-request` safe output.
5. CI and required human review decide whether the PR can merge.
6. `jira-pr-status.yml` comments the PR status on the Jira issue when the PR title contains its Jira key.

## Jira webhook setup

Create a Jira Automation rule manually in Jira:

- Trigger: issue transitioned to `Agent-ready`.
- Action: send a POST request to:
  `https://api.github.com/repos/brainupgrade-in/weather-app/dispatches`
- Headers: `Accept: application/vnd.github+json` and `Authorization: Bearer <GitHub token>`.
- JSON body:

```json
{
  "event_type": "jira-ready-for-development",
  "client_payload": {
    "jira_key": "WAPP-001",
    "jira_url": "https://your-site.atlassian.net/browse/WAPP-001",
    "summary": "Implement the approved change",
    "description": "Acceptance criteria and implementation notes"
  }
}
```

Use a dedicated GitHub token owned by an integration account with only `Issues: Read and write` access to this
repository. Store it in Jira Automation's secret store, not in this repository or Jira issue text.

The GitHub `repository_dispatch` endpoint authenticates the webhook request. No Jira token is required by the
repository dispatch workflow itself; the Atlassian credentials are used only by the fallback poller and PR status
workflow.

## Atlassian MCP

The optional `.vscode/mcp.json` registers Atlassian's remote MCP server for Copilot sessions. Authenticate through the
VS Code MCP prompt when first connecting. Do not add an API token to this file. MCP lets the agent read Jira details,
search related work, and add progress context; the webhook remains the event trigger.

## Safety gates

- Jira `Agent-ready` is the explicit scope and readiness gate.
- The agent opens a draft PR; it cannot merge it.
- The agent cannot modify workflow files or credentials.
- GitHub branch protection requires CI and human PR review before merge.

## Plan and test expectations

The agent should use the relevant specification and plan, including [spec.md](../specs/001-weather-lookup/spec.md)
and [plan.md](../specs/001-weather-lookup/plan.md). A PR is incomplete without focused tests and a clear report of
what was verified.