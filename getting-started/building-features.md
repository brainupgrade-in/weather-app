# Building Features Guide

This guide describes the repeatable feature workflow used for WAPP-1 Weather Lookup and WAPP-2 Temperature Unit Toggle. After setup, the intended human intervention is limited to reviewing and merging the specification PR and the implementation PR.

## Lifecycle at a glance

```text
Jira Story (To Do)
  -> specification PR  [WAPP-n], specs/ only
  -> human merges the specification PR       Jira gets a comment, stays open
  -> implementation dispatch
  -> GitHub issue labeled agent-ready  +  agent started
  -> Jira In Progress
  -> Copilot implementation
  -> draft implementation PR  [agent] [WAPP-n]
  -> CI and human review
  -> human merges the implementation PR
  -> Jira Done, GitHub issue closed
```

Jira is the source of truth for requirements, priority, ownership, and status. GitHub is the source of truth for code, pull requests, CI, and agent execution.

## 1. Choose the next feature

Start from an open question, a user problem, or a clearly bounded improvement. Prefer one independently testable behavior per feature.

For the Weather App, the first feature was WAPP-1 Weather Lookup. Its open question about Celsius versus Fahrenheit became WAPP-2 Temperature Unit Toggle.

Before creating work, check:

- Is the behavior separate from existing scope?
- Can acceptance criteria be written as observable outcomes?
- Can it be implemented without changing unrelated contracts?
- Is there an existing specification or decision that constrains it?

Avoid starting with a vague request such as `make the weather better`. Write a concrete outcome instead.

## 2. Create the Jira Story

Create a Story in Jira project `WAPP`:

- Summary: short feature name.
- Description: user story, scope, and acceptance criteria. Add links to the repository spec and plan once they exist.
- Status: `To Do`.

Jira generates the key, for example `WAPP-3`. Use that exact key everywhere a key appears: the specification's Feature ID, PR titles, and commit messages. Do not zero-pad it: the workflows look up the key from PR titles, and Jira has no issue called `WAPP-003`.

Leave the Story in `To Do`. Implementation starts only when its specification PR is merged.

## 3. Write the specification

Create a new numbered directory under `specs/`. The directory number is only for ordering and may be zero-padded:

```text
specs/003-your-feature/
  spec.md
  plan.md
```

The specification should contain:

- Feature ID: the Jira key, for example `WAPP-3`.
- User story.
- In-scope and out-of-scope behavior.
- Functional requirements.
- Non-functional requirements when relevant.
- API or UI contract.
- Acceptance criteria.
- Risks and open questions.

Keep the specification testable. Example acceptance criteria from WAPP-2:

- A fresh page displays Celsius by default.
- Selecting Fahrenheit converts the current displayed value.
- The selection is restored from `sessionStorage`.
- Switching units does not issue another provider request.
- The control is keyboard accessible.

Update `specs/README.md` with a link to the new specification.

## 4. Open the specification PR

Create a branch and commit only the specification and supporting plan:

```bash
git switch -c feat/wapp-3-your-feature-spec
git add specs/003-your-feature specs/README.md
git diff --cached --check
git commit -m "Specify WAPP-3 your feature"
git push --set-upstream origin feat/wapp-3-your-feature-spec
```

Open a PR whose title starts with the Jira key in brackets:

```text
[WAPP-3] Specify your feature
```

Both rules matter. `spec-merged-dispatch.yml` treats a merged PR as a specification only when its title starts with `[WAPP-<number>]` **and** every changed file is under `specs/`. A PR that also touches code or docs will not start the agent.

The specification PR is the first review boundary. Reviewers check scope and acceptance criteria, not implementation code.

## 5. Review and merge the specification PR

Wait for CI, review the specification, and merge the PR. After merge:

1. `jira-pr-status.yml` sees that only `specs/` changed, comments "Specification merged" on the Jira issue, and leaves its status alone.
2. `spec-merged-dispatch.yml` reads the Jira issue and sends a `jira-ready-for-development` repository dispatch.
3. `jira-ready-dispatch.yml` creates a GitHub issue titled `[WAPP-3] <summary>` with the `agent-ready` and `jira-synced` labels.
4. The same workflow starts **Implement approved Jira work** for that issue number.
5. Jira moves to `In Progress`.

Step 4 is an explicit dispatch, not the label. Anything done with the built-in Actions token (`github.token`), including adding a label, cannot trigger another workflow; GitHub makes an exception only for `workflow_dispatch` and `repository_dispatch`. The implementation workflow allows `github-actions[bot]` in its `on.bots` list so that dispatch passes its permission check.

Check it started: **Actions > Implement approved Jira work** should show a run for the new issue within a minute.

## 6. Let the agent implement

The implementation workflow reads:

- The GitHub issue.
- The linked Jira description.
- The specification on `main`.
- The relevant implementation plan.

It should:

- Inspect the existing code before editing.
- Follow the plan's test strategy.
- Keep the API contract stable unless the specification explicitly changes it.
- Run focused tests.
- Open one draft PR with the Jira key in the title and `Closes #<issue>` in the body.
- Report changed files, tests, and unresolved risks.

The agent is restricted by `allowed-files`. It may modify application, tests, specifications, documentation, and approved manifests, but not workflow files or credentials.

No manual code changes are required at this stage.

## 7. Review the implementation PR

When the draft PR appears:

1. **Start its checks.** The PR is opened by `github-actions[bot]`, so its workflow runs wait for approval and show as **Action required**. Approve the pending runs from the PR's checks, or push a commit to the branch (for example with **Update branch**): a human push starts CI normally.
2. Check that the PR title contains the Jira key and the body closes the GitHub issue.
3. Compare the implementation against the acceptance criteria.
4. Inspect the tests and confirm external calls are mocked where required.
5. Confirm CI passes, especially `Tests / tests`, which runs both pytest and the JavaScript tests.
6. Check that no secrets or unrelated files were changed.
7. Resolve review comments.
8. Mark the PR **Ready for review**, then approve and merge it.

The human review and merge are the safety gate. Do not allow the agent to merge its own PR.

## 8. Automatic completion

When the implementation PR is merged, `jira-pr-status.yml`:

1. Extracts the Jira key from the PR title.
2. Sees that the PR changed files outside `specs/`.
3. Looks up the Jira project's `Done` transition and transitions the Jira issue to `Done`.
4. Adds the merged PR link as a Jira comment.

GitHub closes the linked issue through the `Closes #<issue>` line. If a PR is closed without merging, Jira receives a status comment but is not marked Done.

## 9. Verify the feature after merge

Update local `main` and run the application:

```bash
git switch main
git pull --ff-only origin main
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt pytest
python -m pytest
node --test tests/test_*.js
python app.py
```

Exercise the feature manually in a browser. For Weather Lookup, verify known, unknown, and empty-city behavior. For a UI feature such as WAPP-2, verify fresh-session defaults, switching, reload persistence, and no duplicate provider request.

Record any follow-up as a new Jira Story or Bug rather than silently expanding the merged feature.

## 10. Troubleshooting

### The agent did not start

1. Open **Actions > Create GitHub issue from Jira readiness** and read the latest run. If the GitHub issue for the key already existed, the workflow only comments and moves Jira; it does not start a second implementation.
2. If the run is missing, open **Actions > Dispatch implementation after specification merge**. Its log says why a PR was not treated as a specification: the title does not start with `[WAPP-<number>]`, or the PR changed files outside `specs/`.
3. If **Implement approved Jira work** ran but its `pre_activation` job denied access, check that `github-actions[bot]` is still listed under `on.bots` in `implement-agent-ready.md`.

To start the agent by hand for an existing issue:

```bash
gh workflow run implement-agent-ready.lock.yml -f issue_number=<issue number>
```

Removing and re-adding the `agent-ready` label yourself also works, because a label added by a person does trigger workflows.

### Agent created an issue instead of a PR

Inspect the agent run's safe-output logs. Common causes are:

- GitHub Actions is not allowed to create pull requests.
- A generated file is outside `create-pull-request.allowed-files`.
- A protected file triggered review fallback.
- The agent produced `noop` because requirements were incomplete.

Fix the workflow policy, merge the fix, and start the agent again as above.

### Jira did not move to In Progress or Done

- A merged specification PR deliberately leaves Jira open; only the implementation PR moves it to Done.
- Check that the Jira project has statuses named exactly `In Progress` and `Done`, and that the integration account can transition issues.
- Check the PR title contains the Jira key exactly as Jira shows it, without zero-padding.

### CI cannot import the application

The repository test workflow sets `PYTHONPATH: .`. Confirm the change is on the PR branch and rerun the checks.

### PR is behind main

Update the feature branch from `origin/main`, resolve conflicts, push, and rerun CI. Do not force-push shared workshop branches.

## Workshop completion checklist

- [ ] Jira Story created in `WAPP` and left in `To Do`.
- [ ] Feature specification and plan added under `specs/`.
- [ ] Specification PR title starts with the Jira key and the PR changes only `specs/`.
- [ ] Specification PR reviewed and merged; Jira received a "Specification merged" comment and is not Done.
- [ ] GitHub issue created with `agent-ready`, and **Implement approved Jira work** started for it.
- [ ] Jira status changed to `In Progress`.
- [ ] Agent draft implementation PR created.
- [ ] Checks approved, CI passed, and implementation PR reviewed.
- [ ] Implementation PR merged.
- [ ] Jira issue automatically changed to `Done` and the GitHub issue closed.
- [ ] Feature manually verified on updated `main`.
