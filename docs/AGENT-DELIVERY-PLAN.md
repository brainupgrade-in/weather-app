# Agent Delivery Plan

## Headline scenario

Someone creates an issue in Jira project `WAPP`. A Jira Automation rule sends it to GitHub, which creates a linked
issue and starts the Copilot implementation agent. Jira moves to `In Progress`. The agent writes the specification,
tests, and code, and opens one draft pull request. A human reviews and merges it, and Jira moves to `Done`.

The step-by-step guides are [getting-started/setup.md](../getting-started/setup.md) and
[getting-started/building-features.md](../getting-started/building-features.md).

## Repository flow

1. A Jira Automation rule on *Issue created* posts the issue key to GitHub as a `jira-ready-for-development`
   repository dispatch.
2. `jira-ready-dispatch.yml` reads the issue from Jira, skips issues that `jira-sync.yml` created from GitHub issues,
   and creates a GitHub issue with the `agent-ready` label.
3. The same workflow starts `implement-agent-ready` for that issue with `workflow_dispatch`, then transitions the Jira
   issue to `In Progress`.
4. `implement-agent-ready.md` reads the issue and the existing specifications, and writes a new specification when
   none covers the issue.
5. The agent uses the restricted `create-pull-request` safe output.
6. CI and required human review decide whether the implementation PR can merge.
7. `jira-pr-status.yml` transitions the Jira issue to Done and comments the merged PR link.

Step 3 dispatches the agent explicitly. A label added with the built-in Actions token cannot trigger another workflow,
so the label records approval but does not start anything on its own.

## Atlassian MCP

The optional `.vscode/mcp.json` registers Atlassian's remote MCP server for Copilot sessions. Authenticate through the
VS Code MCP prompt when first connecting. Do not add an API token to this file. MCP lets the agent read Jira details,
search related work, and add progress context; it does not start any workflow.

## Safety gates

- Creating an issue in `WAPP` starts the agent, so the project's *Create issues* permission is the scope gate.
- The GitHub token in the Jira rule can only reach this repository, with Contents: Read and write.
- The agent opens a draft PR; it cannot merge it.
- The agent cannot modify workflow files or credentials.
- GitHub branch protection requires CI and human PR review before merge.
- After merge, `jira-pr-status.yml` applies the Jira project's `Done` transition and comments the merged PR link.

## Plan and test expectations

The agent should use or write the relevant specification and plan, following
[spec.md](../specs/001-weather-lookup/spec.md) and [plan.md](../specs/001-weather-lookup/plan.md). A PR is incomplete
without focused tests and a clear report of what was verified.
