<#
observe-empty-grep.ps1 - Claude Code PostToolUse hook (matcher: Grep). S0041.

Speaks only when a Grep that found nothing WOULD have found something with a wider scope. Two widenings,
each keeping the call's pattern, glob, type, case and multiline options:
  1. path dropped  - the call carried a path below the repository root; the same pattern is searched
                     across the whole repository (ignore rules kept).
  2. ignore lifted - the same scope is searched again with --no-ignore --hidden, so a hit that lives only
                     in a gitignored tree (temp/, dev/, logs/ ..) is named instead of read as "absent".
Behaviour adapted from the FMS_A hook of the same name (no code copied); widening 2 is this repository's.

Asymmetry is the design: context is attached ONLY when a widened run finds something, so the hook cannot
contradict a correct "not found". When every widened run also misses, it prints nothing.

Patterns for which zero is the correct answer (the probe-tag sweep) are skipped: a widened run would only
rediscover the literal quoted in the ticket that asked for the sweep.

Contract: stdin is the PostToolUse payload; stdout is a JSON object with
hookSpecificOutput.additionalContext, or nothing. Fail-silent on any parse, IO or search error.

Exit codes:
  0  always - with or without attached context.

Registered in .claude/settings.json behind a stdin pre-filter, so a Grep that found something pays no
pwsh start. Inventory: docs/AGENT_HOOKS.md.
#>

[CmdletBinding()]
param(
    # Overridable so the tests search a fixture tree instead of the live repository.
    [string] $RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

function Stop-Quietly { exit 0 }

$AbsenceChecks = @(
    'console\s*\\?\.\s*debug\s*\\?\(\s*\\?"S\\?\[?\d',   # probe-tag sweep (CLAUDE.md section 5)
    'S\\d\{4\}\\?:',                                    # probe-tag sweep in its regex form
    'S\d{4}\\?:'                                        # one ticket's probe sweep
)
$MaxFilesListed = 5
$TimeoutSeconds = 8

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { Stop-Quietly }
    $payload = $raw | ConvertFrom-Json
}
catch { Stop-Quietly }

if ([string]$payload.tool_name -ne 'Grep') { Stop-Quietly }
$toolInput = $payload.tool_input
if ($null -eq $toolInput) { Stop-Quietly }
$props = @($toolInput.PSObject.Properties.Name)

$pattern = if ($props -contains 'pattern') { [string]$toolInput.pattern } else { '' }
if ([string]::IsNullOrWhiteSpace($pattern)) { Stop-Quietly }
foreach ($absence in $AbsenceChecks) {
    try { if ($pattern -match $absence) { Stop-Quietly } } catch { Stop-Quietly }
}

# Empty result: the text form ("No matches found" / "No files found") or a structured zero count.
$response = $payload.tool_response
$isEmpty = $false
try {
    if ($response -is [string]) { $isEmpty = $response -match '(?i)no (matches|files) found' }
    elseif ($null -ne $response) {
        $rp = @($response.PSObject.Properties.Name)
        $body = $response | ConvertTo-Json -Depth 6 -Compress
        if ($body -match '(?i)no (matches|files) found') { $isEmpty = $true }
        elseif ($rp -contains 'numFiles' -and [int]$response.numFiles -eq 0 -and
            -not ($rp -contains 'numLines' -and [int]$response.numLines -gt 0) -and
            -not ($rp -contains 'numMatches' -and [int]$response.numMatches -gt 0)) { $isEmpty = $true }
    }
}
catch { Stop-Quietly }
if (-not $isEmpty) { Stop-Quietly }

$rg = Get-Command rg -ErrorAction SilentlyContinue
if (-not $rg) { Stop-Quietly }

$root = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd('\', '/')
$pathArg = if ($props -contains 'path') { [string]$toolInput.path } else { '' }
$scope = $root
if (-not [string]::IsNullOrWhiteSpace($pathArg)) {
    try {
        $candidate = $pathArg.Trim()
        if (-not [System.IO.Path]::IsPathRooted($candidate)) { $candidate = Join-Path $root $candidate }
        $scope = [System.IO.Path]::GetFullPath($candidate).TrimEnd('\', '/')
    }
    catch { Stop-Quietly }
}
# A scope outside the repository is not this hook's question.
if (-not ($scope -eq $root -or $scope.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase))) { Stop-Quietly }

$baseArgs = @('--files-with-matches', '--no-messages', '--color', 'never', '--max-filesize', '5M')
if ($props -contains 'glob' -and -not [string]::IsNullOrWhiteSpace([string]$toolInput.glob)) { $baseArgs += @('--glob', [string]$toolInput.glob) }
if ($props -contains 'type' -and -not [string]::IsNullOrWhiteSpace([string]$toolInput.type)) { $baseArgs += @('--type', [string]$toolInput.type) }
if ($props -contains '-i' -and $toolInput.'-i') { $baseArgs += '--ignore-case' }
if ($props -contains 'multiline' -and $toolInput.multiline) { $baseArgs += @('--multiline', '--multiline-dotall') }

function Invoke-Widened([string[]] $Extra, [string] $Where) {
    $rgArgs = @($baseArgs) + @($Extra) + @('--regexp', $pattern, '--', $Where)
    $psi = [System.Diagnostics.ProcessStartInfo]::new($rg.Source)
    foreach ($a in $rgArgs) { $psi.ArgumentList.Add($a) }
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
    $null = $proc.StandardError.ReadToEndAsync()
    if (-not $proc.WaitForExit($TimeoutSeconds * 1000)) {
        try { $proc.Kill($true) } catch { }
        return , @()
    }
    $lines = @($stdoutTask.Result -split "`r?`n" | Where-Object { $_ })
    return , $lines
}

function Format-Hits([string[]] $Hits) {
    $shown = $Hits | Select-Object -First $MaxFilesListed | ForEach-Object {
        $full = [System.IO.Path]::GetFullPath($_)
        if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { $full = $full.Substring($root.Length) }
        $full.TrimStart('\', '/').Replace('\', '/')
    }
    $more = if ($Hits.Count -gt $MaxFilesListed) { " (+$($Hits.Count - $MaxFilesListed) more)" } else { '' }
    return ($shown -join ', ') + $more
}

$notes = @()
try {
    if ($scope -ne $root) {
        $wide = @(Invoke-Widened @() $root)
        if ($wide.Count -gt 0) {
            $notes += "This Grep found nothing under path '$pathArg', but the same pattern matches $($wide.Count) file(s) elsewhere in the repository: $(Format-Hits $wide). Re-run without 'path' (or with one of those paths) before concluding the text does not exist."
        }
    }
    if ($notes.Count -eq 0) {
        $ignored = @(Invoke-Widened @('--no-ignore', '--hidden') $scope)
        if ($ignored.Count -gt 0) {
            $notes += "This Grep found nothing, but the same pattern matches $($ignored.Count) file(s) inside gitignored or hidden trees, which the search skips: $(Format-Hits $ignored). Name that tree in 'path' to search it."
        }
    }
}
catch { Stop-Quietly }

if ($notes.Count -eq 0) { Stop-Quietly }

$out = [PSCustomObject]@{
    hookSpecificOutput = [PSCustomObject]@{
        hookEventName     = 'PostToolUse'
        additionalContext = ($notes -join "`n")
    }
}
try {
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($out | ConvertTo-Json -Depth 5 -Compress))
    $stdout = [Console]::OpenStandardOutput()
    $stdout.Write($bytes, 0, $bytes.Length)
    $stdout.Flush()
}
catch { }
exit 0
