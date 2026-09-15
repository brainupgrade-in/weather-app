# Agent Delivery Plan

## Headline scenario

When a Jira issue reaches `Ready for development`, the scheduled GitHub poller dispatches a
`jira-ready-for-development` repository event. GitHub creates a linked issue. After a maintainer confirms the
acceptance criteria and applies `agent-ready`, the agent implements the change, runs focused tests, and opens one
draft pull request.

## Repository flow

1. `jira-poll-ready.yml` finds Jira issues in `Ready for development` every 15 minutes and dispatches the event.
2. `jira-ready-dispatch.yml` creates a GitHub issue from the Jira payload.
3. A maintainer confirms scope and applies the `agent-ready` label.
4. `implement-agent-ready.md` reads the issue and repository specification.
5. The agent uses the restricted `create-pull-request` safe output.
6. CI and human review decide whether the PR can merge.
7. `jira-pr-status.yml` comments the PR status on the Jira issue when the PR title contains its Jira key.

## Jira Automation alternative

No Jira Automation rule is required. The repository poller uses the existing Atlassian credentials stored in GitHub
Actions and avoids depending on Jira's unavailable automation-rule REST endpoint. It is enabled by the existing
`JIRA_SYNC_ENABLED` repository variable.

If an organization requires Jira Automation instead, the equivalent rule is:

Create a Jira Automation rule manually in Jira:

- Trigger: issue transitioned to `Ready for development`.
- Action: send a POST request to:
  `https://api.github.com/repos/brainupgrade-in/weather-app/dispatches`
- Headers: `Accept: application/vnd.github+json` and `Authorization: Bearer <GitHub token>`.
- JSON body:

```json
{
  "event_type": "jira-ready-for-development",
  "client_payload": {
    "jira_key": "KAN-123",
    "jira_url": "https://your-site.atlassian.net/browse/KAN-123",
    "summary": "Implement the approved change",
    "description": "Acceptance criteria and implementation notes"
  }
}
```

Use a dedicated GitHub token owned by an integration account with only `Issues: Read and write` access to this
repository. Store it in Jira Automation's secret store, not in this repository or Jira issue text.

## Safety gates

- Jira readiness does not directly grant the agent code-write authority.
- `agent-ready` is a human approval gate.
- The agent opens a draft PR; it cannot merge it.
- The agent cannot modify workflow files or credentials.
- Jira status changes should be performed by a human or a separate approved Jira transition rule after CI and review.

## Plan and test expectations

The agent should use the relevant specification and plan, including [spec.md](../specs/001-weather-lookup/spec.md)
and [plan.md](../specs/001-weather-lookup/plan.md). A PR is incomplete without focused tests and a clear report of
what was verified.