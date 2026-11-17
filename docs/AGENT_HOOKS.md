# Agent hooks - FastMediaSorter Web

The project hooks Claude Code runs in this repository, on top of the hooks the `sza` plugin ships (their
inventory is the plugin's `hooks/README.md`). A hook fires inside a tool call nobody reads, so a hook missing
from this table is indistinguishable from a bug in the tool. Registering, removing or re-registering a hook
edits this table in the same change (`.claude/rules/repo-scripts.md`, "Hooks").

## Inventory

| Hook | Event | Verdict | What it does | Escape |
| --- | --- | --- | --- | --- |
| [`guard-manual-task-wait.ps1`](../.claude/hooks/guard-manual-task-wait.ps1) | `PreToolUse` (Bash, PowerShell, Monitor) | refuses | a wait loop on a background task's `.output` file, any Monitor on one, and any read of a subagent transcript; one plain read of a command's output stays allowed | `SZA_TASK_OUTPUT_OK=1` |
| [`observe-empty-grep.ps1`](../.claude/hooks/observe-empty-grep.ps1) | `PostToolUse` (Grep) | observes | after an empty Grep, re-runs it without its path and then with ignore rules lifted; speaks only when a wider run finds the text, naming the files (a gitignored tree such as `temp/` or `dev/` included) | none needed - silent unless it holds a counter-example |
| [`refuse-unexplained-red-verdict.ps1`](../.claude/hooks/refuse-unexplained-red-verdict.ps1) | `Stop` | refuses | a turn ending while `tools/post-change.ps1` returned `FAIL` or `CANNOT VERIFY` (exit 1 or 2) and nothing afterwards read the gate output under `temp/post-change/` or got a passing re-run | a second stop in a row (`stop_hook_active`) is allowed |

Registration: `.claude/settings.json`. The `PostToolUse` Grep hook sits behind a stdin pre-filter, so a Grep
that found something pays no `pwsh` start.

## Contracts

- Every hook fails open: a payload, path or IO surprise allows the call or the stop and attaches nothing.
- A refusing `PreToolUse` hook exits 2 with the reason on stderr; the `Stop` hook prints
  `{"decision":"block","reason":".."}` and exits 0.
- An observing hook attaches `hookSpecificOutput.additionalContext` only when it holds a counter-example, so
  it cannot contradict a correct "not found".

## Tests

`pwsh -NoProfile -File .claude/hooks/tests/Run-HookTests.ps1` (from the PowerShell tool, where `rg` resolves)
feeds each hook applicable and non-applicable payloads through stdin and checks that the registration in
`.claude/settings.json` and the table above name the same hooks. Verdict line `HOOK-TESTS: PASS (<n> cases)`;
exit 0 pass, 1 a case failed, 2 could not verify.
