# Agent Delivery Plan

## Headline scenario

A human merges a specification PR for a Jira Story. GitHub creates a linked issue with the `agent-ready` label and
starts the Copilot implementation agent for it. The agent implements the change, runs focused tests, and opens one
draft pull request. Human approval is required for the specification PR and for the implementation PR's review and
merge.

The step-by-step guide is [getting-started/building-features.md](../getting-started/building-features.md).

## Repository flow

1. The specification PR title starts with the Jira key (for example `[WAPP-3]`), it changes only files under `specs/`,
   and a human reviews and merges it.
2. `jira-pr-status.yml` comments on the Jira issue and leaves its status unchanged, because only `specs/` changed.
3. `spec-merged-dispatch.yml` fetches the Jira issue and sends a `jira-ready-for-development` repository dispatch.
4. `jira-ready-dispatch.yml` creates a GitHub issue with the `agent-ready` label, starts `implement-agent-ready` for
   that issue with `workflow_dispatch`, and transitions the Jira issue to `In Progress`.
5. `implement-agent-ready.md` reads the issue and repository specification.
6. The agent uses the restricted `create-pull-request` safe output.
7. CI and required human review decide whether the implementation PR can merge.
8. `jira-pr-status.yml` transitions the Jira issue to Done and comments the merged PR link.

Step 4 dispatches the agent explicitly. A label added with the built-in Actions token cannot trigger another workflow,
so the label records approval but does not start anything on its own.

## Atlassian MCP

The optional `.vscode/mcp.json` registers Atlassian's remote MCP server for Copilot sessions. Authenticate through the
VS Code MCP prompt when first connecting. Do not add an API token to this file. MCP lets the agent read Jira details,
search related work, and add progress context; it does not start any workflow.

## Safety gates

- The merged specification PR is the explicit scope and readiness gate.
- The agent opens a draft PR; it cannot merge it.
- The agent cannot modify workflow files or credentials.
- GitHub branch protection requires CI and human PR review before merge.
- After merge, `jira-pr-status.yml` applies the Jira project's `Done` transition and comments the merged PR link.

## Plan and test expectations

The agent should use the relevant specification and plan, including [spec.md](../specs/001-weather-lookup/spec.md)
and [plan.md](../specs/001-weather-lookup/plan.md). A PR is incomplete without focused tests and a clear report of
what was verified.
