<#
refuse-unexplained-red-verdict.ps1 - Claude Code Stop hook. S0041.

Refuses to let a turn end while the closure facade (tools/post-change.ps1) returned a red verdict in
this turn and nothing afterwards looked at why. Behaviour adapted from the FMS_A hook of the same name
(no code copied); here the explanation is the facade's own per-gate output under temp/post-change/.

Why a Stop hook: PostToolUse never fires on a failed tool call and the Bash tool_response carries no
exit code (.claude/rules/repo-scripts.md, "Hooks"), so the transcript is the only place a red result
is visible. The transcript is read from transcript_path in the payload.

Red, for a tool call whose command names post-change.ps1:
  - its tool_result is an error whose text starts a line with `Exit code 1` or `Exit code 2`, or
  - its result text carries `POST-CHANGE: FAIL` or `POST-CHANGE: CANNOT VERIFY`;
and any other tool result carrying one of those verdict lines (the facade's output redirected to a file
under temp/ and read back) is red too.
Exit 1 is a failed gate and exit 2 is could-not-verify (the facade header); neither is normal flow.

Released - the turn may end - when, after the last red result in this turn, either:
  - a tool call names temp/post-change/ (a Read of a gate output, a cat, a Get-Content), or
  - a later result carries `POST-CHANGE: PASS` (a passing re-run, direct or read back).
Only the current turn is judged: rows before the operator's last prompt are ignored.

Contract: stdin is the Stop payload. stdout {"decision":"block","reason":".."} refuses the stop;
nothing allows it. Fail-open everywhere: any parse, IO or shape surprise allows the stop.

Exit codes:
  0  always - the verdict travels in stdout.

Registered in .claude/settings.json. Inventory: docs/AGENT_HOOKS.md.
#>

[CmdletBinding()]
param(
    # Overridable so the tests drive fixture transcripts instead of a live session.
    [string] $TranscriptPath
)

function Approve-Stop { exit 0 }

$FacadeName = 'post-change.ps1'
$OutputDirPattern = '(?i)temp[\\/]+post-change'

try {
    $raw = [Console]::In.ReadToEnd()
    $payload = if ([string]::IsNullOrWhiteSpace($raw)) { $null } else { $raw | ConvertFrom-Json }
}
catch { Approve-Stop }

# A second refusal in a row is the operator's call, not this hook's: stop_hook_active means the turn
# already continued once because of a Stop hook.
if ($payload -and $payload.stop_hook_active -eq $true) { Approve-Stop }

$transcript = if ($TranscriptPath) { $TranscriptPath }
elseif ($payload -and $payload.transcript_path) { [string]$payload.transcript_path }
else { '' }
if ([string]::IsNullOrWhiteSpace($transcript) -or -not (Test-Path -LiteralPath $transcript)) { Approve-Stop }

# Hot path: this runs at the end of every turn. A transcript that never mentions the facade is allowed
# after one string scan, without parsing a single JSON row.
$lines = $null
try { $lines = [System.IO.File]::ReadAllLines($transcript) } catch { Approve-Stop }
# The turn starts at the last user row that carries no tool_result; a string test finds the candidate
# and the JSON parse below confirms it, so only the current turn is ever parsed.
$from = 0
for ($k = $lines.Length - 1; $k -ge 0; $k--) {
    $l = $lines[$k]
    if ($l -match '"type"\s*:\s*"user"' -and $l -notmatch '"tool_result"') { $from = $k; break }
}
$mentions = $false
for ($k = $from; $k -lt $lines.Length; $k++) {
    if ($lines[$k].IndexOf('post-change', [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { $mentions = $true; break }
}
if (-not $mentions) { Approve-Stop }

$rows = [System.Collections.Generic.List[object]]::new()
try {
    for ($k = $from; $k -lt $lines.Length; $k++) {
        if (-not $lines[$k]) { continue }
        try { $rows.Add(($lines[$k] | ConvertFrom-Json -Depth 40)) } catch { continue }
    }
}
catch { Approve-Stop }
if ($rows.Count -eq 0) { Approve-Stop }

function Get-Items($Row) {
    $msg = $Row.message
    if ($null -eq $msg) { return , @() }
    $content = $msg.content
    if ($null -eq $content -or $content -is [string]) { return , @() }
    return , @($content)
}

function Test-IsOperatorPrompt($Row) {
    if ([string]$Row.type -ne 'user') { return $false }
    $msg = $Row.message
    if ($null -eq $msg) { return $false }
    if ($msg.content -is [string]) { return $true }
    foreach ($item in @($msg.content)) { if ([string]$item.type -eq 'tool_result') { return $false } }
    return $true
}

function Get-ResultText($Item) {
    if ($Item.content -is [string]) { return [string]$Item.content }
    return (@($Item.content) | ForEach-Object { [string]$_.text }) -join "`n"
}

try {
    $turnStart = 0
    for ($i = $rows.Count - 1; $i -ge 0; $i--) {
        if (Test-IsOperatorPrompt $rows[$i]) { $turnStart = $i; break }
    }

    # Walk the turn in order: tool_use rows register commands, tool_result rows judge them.
    $facadeIds = @{}
    $lastRedAt = -1
    $lastRedCommand = ''
    $releasedAt = -1
    for ($i = $turnStart; $i -lt $rows.Count; $i++) {
        foreach ($item in (Get-Items $rows[$i])) {
            $type = [string]$item.type
            if ($type -eq 'tool_use') {
                $inputText = ''
                try { $inputText = $item.input | ConvertTo-Json -Depth 8 -Compress } catch { }
                $command = [string]$item.input.command
                if ($command -like "*$FacadeName*") { $facadeIds[[string]$item.id] = $command }
                elseif ($inputText -match $OutputDirPattern) { $releasedAt = $i }
            }
            elseif ($type -eq 'tool_result') {
                $id = [string]$item.tool_use_id
                $text = Get-ResultText $item
                $verdictRed = $text -match 'POST-CHANGE: (FAIL|CANNOT VERIFY)'
                if (-not $facadeIds.ContainsKey($id)) {
                    # The facade's output redirected to a file and read back: the verdict seen there counts.
                    if ($verdictRed) { $lastRedAt = $i; $lastRedCommand = '(a read of a post-change.ps1 verdict)' }
                    elseif ($text -match 'POST-CHANGE: PASS') { $releasedAt = $i }
                    continue
                }
                $red = $verdictRed -or ($item.is_error -eq $true -and $text -match '(?m)^\s*Exit code (1|2)\b')
                if ($red) { $lastRedAt = $i; $lastRedCommand = $facadeIds[$id] }
                elseif ($text -match 'POST-CHANGE: PASS') { $releasedAt = $i }
            }
        }
    }
}
catch { Approve-Stop }

if ($lastRedAt -lt 0 -or $releasedAt -gt $lastRedAt) { Approve-Stop }

$shown = if ($lastRedCommand.Length -gt 200) { $lastRedCommand.Substring(0, 200) + '..' } else { $lastRedCommand }
$reason = @(
    'This turn left a red closure verdict nobody looked at:',
    "  $shown",
    'Exit 1 is a failed gate and exit 2 is could-not-verify; neither writes the dev-log row.',
    'Before ending the turn, read the failing gate''s output under temp/post-change/ (the facade printed',
    'which step failed), then say whether the failure is yours, already ticketed or foreign, and act on it.'
) -join "`n"

$out = [PSCustomObject]@{ decision = 'block'; reason = $reason }
try {
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($out | ConvertTo-Json -Depth 4 -Compress))
    $stdout = [Console]::OpenStandardOutput()
    $stdout.Write($bytes, 0, $bytes.Length)
    $stdout.Flush()
}
catch { }
exit 0
