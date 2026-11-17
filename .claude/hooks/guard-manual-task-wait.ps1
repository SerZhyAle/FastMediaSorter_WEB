<#
guard-manual-task-wait.ps1 - Claude Code PreToolUse hook (matcher: Bash|PowerShell|Monitor). S0041.

Refuses a shell command that waits on a background task's own output file - the
`<sep>tasks<sep><name>.output` file the harness writes for a backgrounded command or a backgrounded
agent. The harness notifies the session when the task ends, so a hand-rolled wait cannot make it end
sooner; it only spends turns. Behaviour adapted from the FMS_A hook of the same name (no code copied).

A call is refused when all of these hold:
  1. the tool is Bash, PowerShell or Monitor;
  2. the command names a path of the shape <sep>tasks<sep><name>.output;
  3. SZA_TASK_OUTPUT_OK is not 1;
  4. at least one of: the tool is Monitor; <name> is a subagent transcript ('a' + 16 hex digits);
     the command carries a wait construct (until, while, sleep, Start-Sleep, tail -f, -Wait).
A single plain read of a background command's output (cat, Get-Content, tail without -f) is allowed:
that file is the command's own stdout and one read after the notification is the cheapest correct move.

Contract: stdin is the PreToolUse payload. Exit 2 with the reason on stderr blocks the call; exit 0
allows it. Fail-open on any parse or IO error - a malformed payload must never make a shell unusable.

Exit codes:
  0  allow - another tool, no task-output path, a plain read, the escape hatch, or an unreadable payload.
  2  block - a wait on a background task's output file, or any read of a subagent transcript.

Hot path: runs on every Bash, PowerShell and Monitor call; the allow path is one regex over a string in
memory and touches no file.

Escape hatch: SZA_TASK_OUTPUT_OK=1.
Registered in .claude/settings.json. Inventory: docs/AGENT_HOOKS.md.
#>

function Approve-Call { exit 0 }

if ($env:SZA_TASK_OUTPUT_OK -eq '1') { Approve-Call }

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { Approve-Call }
    $payload = $raw | ConvertFrom-Json
    $toolName = [string]$payload.tool_name
}
catch { Approve-Call }

if ($toolName -notin @('Bash', 'PowerShell', 'Monitor')) { Approve-Call }

$command = ''
try {
    $command = [string]$payload.tool_input.command
    # A renamed input member must not silently disarm the guard: fall back to the serialised input.
    if ([string]::IsNullOrWhiteSpace($command) -and $payload.tool_input) {
        $command = $payload.tool_input | ConvertTo-Json -Depth 6 -Compress
    }
}
catch { Approve-Call }
if ([string]::IsNullOrWhiteSpace($command)) { Approve-Call }

# The `.output` extension separates a task file from an ordinary path containing a `tasks` folder.
$taskMatch = [regex]::Match($command, '(?i)[\\/]tasks[\\/]([^\\/\s"'']+)\.output\b')
if (-not $taskMatch.Success) { Approve-Call }
$taskName = $taskMatch.Groups[1].Value

$isAgentTranscript = $taskName -match '^a[0-9a-f]{16}$'
$hasWait = $command -match '(?i)\b(until|while|sleep|Start-Sleep)\b|tail\s+(-[a-z]*f|--follow)|-Wait\b'
if ($toolName -ne 'Monitor' -and -not $isAgentTranscript -and -not $hasWait) { Approve-Call }

$reason = @(
    'BLOCKED by guard-manual-task-wait (S0041): that is a background task''s output file. The harness',
    'notifies this session when the task ends, so waiting on the file cannot make it end sooner.',
    '',
    'Instead:',
    '  - continue with other work; the completion notification arrives by itself',
    '  - a background COMMAND''s output: one plain read after the notification (Read, cat, Get-Content)',
    '  - a background AGENT''s .output: never - it is the whole subagent transcript',
    '  - Monitor is for state the harness does not track (a remote queue, an external service)',
    '',
    'Escape: SZA_TASK_OUTPUT_OK=1'
) -join [Environment]::NewLine
[Console]::Error.WriteLine($reason)
exit 2
