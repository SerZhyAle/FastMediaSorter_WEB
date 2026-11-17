---
paths:
  - "tools/**"
  - "tests/*.ps1"
  - "*.ps1"
  - ".claude/**"
---

# Repository scripts and hooks - working rules

Loads with any script, hook or agent-config file. The always-loaded verdict rules are in `CLAUDE.md` section 6.

## Before writing a script

- Grep `tools/`, `tests/` and the harness for a script in the same domain and extend it instead of writing a parallel one.
- Learn a script's interface from its header and `param(` block (for a harness script, in the copy the forwarder resolves to), never by calling it with a partial argument set: scripts with write verbs have no dry path.
- A harness forwarder resolves to one real copy among several on disk (plugin cache versions, the canon checkout, `SZA_HARNESS_ROOT`). Resolve and quote the copy that runs before claiming a mechanism is present or missing.
- A small self-contained fix to a script and its test is done in the same turn; never offer to file a ticket for it.
- Header lists every exit code the script returns; 0 passed, 1 found a defect, 2 could not verify.

## PowerShell traps

- Under `$ErrorActionPreference='Stop'` a bare `Write-Error` throws, so the following `exit N` never runs: write `Write-Error $msg -ErrorAction Continue` before `exit N`.
- Present/absent flags are `[switch]`, never `[bool]` (`pwsh -File` passes strings). Never use the colon form `-X:$false` through a forwarder that re-splats `$args`: it arrives as two arguments.
- A `[string[]]` parameter reached through `pwsh -File` binds a comma list as one element. Pass one quoted CSV to scripts that split internally; never splat a built array at `tools/harness.ps1` - use literal named parameters or a hashtable.
- Wrap function results at the call site: `$hits = @(Get-Thing ..)`. `return @()` emits nothing; return `, @($items)`. A lone hashtable's `.Count` is its field count; `@($obj.member).Count` is 1 for an absent member - test `$null -ne $obj.member` first.
- Never name a local the same as a parameter in any letter case, never name a splat `$args`, never shadow `$Input`/`$Error`/`$Host`/`$PSItem`.
- `$Matches` is overwritten by every later `-match`: capture the group on the next statement. `-match`/`-replace` are case-insensitive: use `-cmatch`/`-creplace` for identifiers. `-like` treats `[ ]` as a character class.
- `$LASTEXITCODE` is `$null` after a cmdlet: put an exit guard only after a native executable. Empty output from a batch means it aborted early.
- `Measure-Object -Line` skips blank lines: use `(Get-Content f).Count` when a threshold depends on it.
- `ConvertFrom-Json` turns ISO strings into culture-formatted dates: use `-DateKind String` or format with the invariant culture.
- `Receive-Job` has no `-Timeout`: `Wait-Job -Timeout N`, then `Receive-Job`.
- Never write the block-comment close token inside a block comment; dot-source the file after editing any header.
- Pass literal values in single quotes; build non-ASCII with `[char]0x2014`; preserve each file's BOM and line terminator on rewrite; detect EOL per file in pwsh, never with `grep -c $'\r'` in Git Bash.
- A script whose stdout is parsed as JSON (a hook) writes raw UTF-8 bytes through `[Console]::OpenStandardOutput()`; this console is cp866.
- Delete a persisted environment variable with `Remove-ItemProperty HKCU:\Environment`, never `SetEnvironmentVariable(name, $null)`.

## Bash-tool traps

- Never run a read-modify-write over real files as an inline `pwsh -Command`; write a `.ps1` with `Set-StrictMode` and `$ErrorActionPreference='Stop'` and run it with `-File`.
- Never author content through a Bash heredoc: a doubled backslash arrives as one, `\a` becomes BEL, an apostrophe breaks the parse, Cyrillic arrives as mojibake. Use the Write tool and only run the file from Bash.
- No backticks inside quoted arguments (command substitution strips the word); never `\$VAR` inside a double-quoted `pwsh -Command`; quote switch values whole.
- Never pass RU/UK text as a Bash-to-pwsh argument; write it to a UTF-8 file and pass the path.
- The Bash tool's PATH is shorter than the PowerShell tool's: `node`, `deno`, `gh`, `rg`, `ffmpeg` resolve only in the PowerShell tool, and a child `pwsh` started from Bash inherits the short PATH. A "command not found" or an empty filter result there proves nothing: re-run from the PowerShell tool. A script with a "tool present?" branch makes both branches give the same verdict or prints "cannot verify".
- Python cannot `subprocess` the Git Bash `pwsh` shim: spell `C:/Program Files/PowerShell/7/pwsh.exe`.
- `C:\WINDOWS\system32\bash.exe` is WSL; test a hook glob against `C:\Program Files\Git\bin\bash.exe`.
- The Bash and PowerShell tools share one working directory: use absolute paths, never a `cd` prefix.

## Hooks

- `PostToolUse` never fires on a failed tool call, and the Bash `tool_response` has no exit code: observe failures from a `Stop` hook reading `transcript_path`.
- `PostToolUse` cannot rewrite a result; a `PreToolUse` rewrite carries the full input object; `additionalContext` reaches the model, `permissionDecisionReason` does not.
- A hook that needs "what this session changed" narrows the shared tree by the transcript's creation time, never by a whole-tree diff.
- Registering a hook edits `docs/AGENT_HOOKS.md` (its inventory) in the same change.
- A gate whose refusals are mostly false is removed, not tuned with ordering rules and memories. A failure mechanism fires at the moment of refusal and names one command to run now; never propose a periodic digest of failures.

## Subagents

- A subagent with no `tools:` allowlist inherits every MCP server of the parent. Give each definition an explicit list; only a browser-driving agent gets the browser tools.
- Briefs for parallel writers forbid every git command and every shared-state run, give each agent a disjoint file list by name, and one central verification runs per wave.
- A subagent's PASS or FAIL observation is evidence; its "because X" is a lead; cited `file:line` prove the lines exist, not the control flow; "no test found" describes its sweep. Re-run the check yourself before relying on it.
- Delegate the driving of a browser, not the measurement: read before/after captures yourself.
- Delegate UI driving only along a known click path at most three screens deep; otherwise drive it in the parent.
- A multi-phase delegated implementation tends to skip its final docs phase: verify every claimed phase on disk and finish the last one yourself.
- A quiet background agent is not stuck while its artifacts move: correct it with SendMessage, never restart it.
- The owner's session limit is shared by every subagent: default to low parallelism; more than about 6-8 agents needs his explicit go.
- `ScheduleWakeup` is for `/loop` only; a background task notifies on its own.

## Runner (`r0.ps1`)

- Never start a runner with a plain `Start-Process` from inside an agent session: strip the `CLAUDE_CODE_*` environment from the child and give each instance its own agent id, then check `chat/agent-chat -Verb Read` shows distinct nicknames.
- A child silent for 15-40 minutes is normal (stage 0 research, buffered output). Judge liveness by its process CPU and its transcript tail; stop it only through `temp/STOP-SPEC-QUEUE`.
- Never end a batch on a guess that context is running out; stop only when nothing eligible is left or every remaining ticket waits on a human.
