# Building Features Guide

This guide describes the repeatable feature workflow for the Weather App. After setup, a feature starts when someone creates a Jira issue, and the only human intervention is reviewing and merging the agent's pull request.

## Lifecycle at a glance

```text
Jira issue created in WAPP
  -> Jira Automation sends the issue key to GitHub
  -> GitHub issue  [WAPP-n] <summary>, labeled agent-ready
  -> Implement approved Jira work starts
  -> Jira In Progress
  -> agent writes the spec and plan, tests, and code
  -> draft PR  [agent] [WAPP-n] ...
  -> human starts the checks, reviews, and merges
  -> Jira Done, GitHub issue closed
```

Jira is the source of truth for requirements, priority, ownership, and status. GitHub is the source of truth for code, pull requests, CI, and agent execution.

## 1. Write the Jira issue

**The agent starts the moment you press Create.** Write the issue completely before creating it; do not create a placeholder and fill it in later.

Prefer one independently testable behavior per issue, and write the description as the requirements the agent will follow:

- **User story:** who wants what, and why.
- **Scope:** what is in and what is out.
- **Acceptance criteria:** observable outcomes, one per line.
- **References:** related specs or earlier issues, if any.

Example acceptance criteria from WAPP-2 Temperature Unit Toggle:

- A fresh page displays Celsius by default.
- Selecting Fahrenheit converts the current displayed value.
- The selection is restored from `sessionStorage`.
- Switching units does not issue another provider request.
- The control is keyboard accessible.

Avoid vague requests such as `make the weather better`. The agent will not implement ambiguous or missing requirements; it stops without opening a PR, and the Jira issue is left in `In Progress`.

## 2. What happens automatically

Within about 20 seconds of creating the issue (for WAPP-4: the GitHub issue after 10 seconds, the agent after 15, and Jira In Progress after 16):

1. The Jira Automation rule sends the issue key to GitHub.
2. **Sync Jira issue to GitHub and start the agent** (`jira-ready-dispatch.yml`) reads the issue from Jira and creates a GitHub issue titled `[WAPP-n] <summary>`, with the full description and the `agent-ready` and `jira-synced` labels.
3. The same workflow starts **Implement approved Jira work** for that GitHub issue.
4. Jira moves to `In Progress`.

Step 3 is an explicit dispatch, not the label. Anything done with the built-in Actions token, including adding a label, cannot trigger another workflow; GitHub makes an exception only for `workflow_dispatch` and `repository_dispatch`. The implementation workflow allows `github-actions[bot]` in its `on.bots` list so that dispatch passes its permission check.

Issues that `jira-sync.yml` created from a GitHub issue are skipped at step 2, so the two syncs cannot loop.

## 3. What the agent does

The implementation workflow reads the GitHub issue, which carries the Jira description, and the existing specifications in `specs/`. It should:

- Inspect the existing code before editing.
- Write `specs/<next number>-<short-name>/spec.md` and `plan.md` from the issue when no specification covers it, with the Jira key (for example `WAPP-4`) as its Feature ID, and link it from `specs/README.md`.
- Follow the plan's test-first approach.
- Keep the API contract stable unless the requirements explicitly change it.
- Run focused tests.
- Open one draft PR with the Jira key in the title and `Closes #<issue>` in the body.
- Report changed files, tests, and unresolved risks.

The agent is restricted by `allowed-files`. It may modify application, tests, specifications, documentation, and approved manifests, but not workflow files or credentials. No manual code changes are required at this stage.

Expect the agent to take about 6 minutes for a feature of WAPP-4's size (5 minutes 46 seconds from start to PR). The last line of the PR description shows what the run cost in AI credits: 48.6 for WAPP-4, about $0.49 at $0.01 per credit.

## 4. Review the implementation PR

When the draft PR appears:

1. **Start its checks.** The PR is opened by `github-actions[bot]`, so its workflow runs wait for approval and show as **Action required**. Approve the pending runs from the PR's checks, or push a commit to the branch (for example with **Update branch**): a human push starts CI normally. Until the checks run, Jira gets no "Pull request opened" comment.
2. Check that the PR title contains the Jira key and the body closes the GitHub issue.
3. Read the specification the agent wrote and compare it with the Jira issue. The spec is part of the review.
4. Compare the implementation against the acceptance criteria.
5. Inspect the tests and confirm external calls are mocked where required.
6. Confirm CI passes, especially `Tests / tests`, which runs both pytest and the JavaScript tests.
7. Check that no secrets or unrelated files were changed.
8. Resolve review comments.
9. Mark the PR **Ready for review**, then approve and merge it.

The human review and merge are the safety gate. Do not allow the agent to merge its own PR.

## 5. Automatic completion

When the PR is merged, `jira-pr-status.yml`:

1. Extracts the Jira key from the PR title.
2. Looks up the Jira project's `Done` transition.
3. Transitions the Jira issue to `Done`.
4. Adds the merged PR link as a Jira comment.

GitHub closes the linked issue through the `Closes #<issue>` line. If a PR is closed without merging, Jira receives a status comment but is not marked Done.

## 6. Verify the feature after merge

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

Record any follow-up as a new Jira issue rather than silently expanding the merged feature.

## Worked example: WAPP-4

The first run of this flow, *Show wind speed in mph when Fahrenheit is selected*, took 10 minutes 20 seconds from Jira issue to Done:

| Time (UTC) | Step |
|---|---|
| 17:35:32 | WAPP-4 created in Jira |
| 17:35:42 | Sync workflow ran and created GitHub issue #18 |
| 17:35:47 | **Implement approved Jira work** started |
| 17:35:48 | Jira: To Do → In Progress |
| 17:41:33 | Agent opened draft PR #19: spec, plan, code, and tests, 48.6 AI credits |
| 17:41–17:45 | Human started the checks, marked the PR ready, reviewed, and merged |
| 17:45:45 | GitHub closed issue #18 |
| 17:45:52 | Jira: In Progress → Done, with the merged PR linked |

The merge used the administrator bypass of the review requirement. In a workshop, approve from a second account instead, or say that you are bypassing it.

## 7. Troubleshooting

### Nothing appeared in GitHub

1. In Jira, open **Project settings > Automation**, then the rule's **Audit log**. The web request should have returned `204`.
   - `401`: the token is wrong or has expired. See *Renew the token* in [setup.md](setup.md#renew-the-token).
   - `404`: the URL is wrong, or the token cannot see the repository.
   - `403`: the token lacks **Contents: Read and write**.
2. If Jira shows `204`, open **Actions > Sync Jira issue to GitHub and start the agent** and read the run log. It says when it skipped an issue: one created from a GitHub issue, or one whose GitHub issue already exists.

### The GitHub issue exists but the agent did not start

1. Open **Actions > Implement approved Jira work**. If its `pre_activation` job denied access, check that `github-actions[bot]` is still listed under `on.bots` in `implement-agent-ready.md`.
2. Start the agent by hand:

   ```bash
   gh workflow run implement-agent-ready.lock.yml -f issue_number=<issue number>
   ```

Removing and re-adding the `agent-ready` label yourself also works, because a label added by a person does trigger workflows.

### The agent run still shows queued after the PR appeared

This is normal. The run's last job, `conclusion`, waits for a free runner after the PR is already open. Check the run's jobs: when `agent`, `detection`, and `safe_outputs` have succeeded, the work is done.

### Agent created an issue instead of a PR

Inspect the agent run's safe-output logs. Common causes are:

- GitHub Actions is not allowed to create pull requests.
- A generated file is outside `create-pull-request.allowed-files`.
- A protected file triggered review fallback.
- The agent produced `noop` because requirements were incomplete. Improve the Jira description, then start the agent again as above.

Fix the workflow policy, merge the fix, and start the agent again.

### Jira did not move to In Progress or Done

- Check that the Jira project has statuses named exactly `In Progress` and `Done`, and that the integration account can transition issues.
- Check the PR title contains the Jira key exactly as Jira shows it, without zero-padding.

### CI cannot import the application

The repository test workflow sets `PYTHONPATH: .`. Confirm the change is on the PR branch and rerun the checks.

### PR is behind main

Update the feature branch from `origin/main`, resolve conflicts, push, and rerun CI. Do not force-push shared workshop branches.

## Workshop completion checklist

- [ ] Jira issue created in `WAPP` with a user story, scope, and acceptance criteria.
- [ ] GitHub issue `[WAPP-n] ...` appeared with the `agent-ready` label.
- [ ] **Implement approved Jira work** started for it.
- [ ] Jira status changed to `In Progress`.
- [ ] Agent draft PR created, including a specification under `specs/`.
- [ ] Checks approved, CI passed, and PR reviewed.
- [ ] PR merged.
- [ ] Jira issue automatically changed to `Done` and the GitHub issue closed.
- [ ] Feature manually verified on updated `main`.
