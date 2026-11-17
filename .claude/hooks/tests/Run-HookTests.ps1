#requires -Version 7.0
<#
.SYNOPSIS
    Contract tests for the project hooks in .claude/hooks (S0041): each hook is fed applicable and
    non-applicable payloads through stdin, exactly as Claude Code calls it, and its exit code and output
    are compared with the expected verdict. Also checks that every hook registered in
    .claude/settings.json is a row of the docs/AGENT_HOOKS.md inventory and the other way round.

.DESCRIPTION
    Fixtures (a small search tree with a .ignore file, Stop-hook transcripts) are written under
    temp/S0041/hook-tests/ and removed at the end. No network, no browser.

    Verdict line: HOOK-TESTS: PASS (<n> cases) | HOOK-TESTS: FAIL (<n> of <m> cases).
    Exit codes: 0 every case passed; 1 a case failed; 2 could not verify (pwsh or rg missing, a hook
    file missing, or the settings file unreadable).
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$hooksDir = Join-Path $repoRoot '.claude/hooks'
$pwshExe = (Get-Process -Id $PID).Path
$work = Join-Path $repoRoot 'temp/S0041/hook-tests'

foreach ($name in 'guard-manual-task-wait.ps1', 'observe-empty-grep.ps1', 'refuse-unexplained-red-verdict.ps1') {
    if (-not (Test-Path -LiteralPath (Join-Path $hooksDir $name))) {
        Write-Host "HOOK-TESTS: CANNOT VERIFY (missing $name)"
        exit 2
    }
}
if (-not (Get-Command rg -ErrorAction SilentlyContinue)) {
    Write-Host 'HOOK-TESTS: CANNOT VERIFY (rg not on PATH - run from the PowerShell tool)'
    exit 2
}

function Invoke-Hook([string] $Hook, [string] $Stdin, [string[]] $HookArgs = @(), [hashtable] $Env = @{}) {
    $psi = [System.Diagnostics.ProcessStartInfo]::new($pwshExe)
    foreach ($a in @('-NoProfile', '-File', (Join-Path $hooksDir $Hook)) + $HookArgs) { $psi.ArgumentList.Add($a) }
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.Environment.Remove('SZA_TASK_OUTPUT_OK') | Out-Null
    foreach ($k in $Env.Keys) { $psi.Environment[$k] = $Env[$k] }
    $p = [System.Diagnostics.Process]::Start($psi)
    $p.StandardInput.Write($Stdin)
    $p.StandardInput.Close()
    $out = $p.StandardOutput.ReadToEndAsync()
    $err = $p.StandardError.ReadToEndAsync()
    if (-not $p.WaitForExit(30000)) { try { $p.Kill($true) } catch { }; return [pscustomobject]@{ Code = -1; Out = ''; Err = 'timeout' } }
    return [pscustomobject]@{ Code = $p.ExitCode; Out = $out.Result; Err = $err.Result }
}

$results = [System.Collections.Generic.List[object]]::new()
function Assert-Case([string] $Name, [bool] $Ok, [string] $Detail) {
    $results.Add([pscustomobject]@{ Name = $Name; Ok = $Ok })
    $mark = if ($Ok) { 'ok  ' } else { 'FAIL' }
    Write-Host "$mark $Name$(if (-not $Ok) { " - $Detail" })"
}

function ConvertTo-Payload([hashtable] $Object) { return ($Object | ConvertTo-Json -Depth 10 -Compress) }

if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
New-Item -ItemType Directory -Force -Path $work | Out-Null

try {
    # --- guard-manual-task-wait -------------------------------------------------------------------
    $taskFile = 'C:/Users/x/AppData/Local/Temp/claude/abc/tasks/b20mchwmo.output'
    $agentFile = 'C:/Users/x/AppData/Local/Temp/claude/abc/tasks/a0123456789abcdef.output'
    $guardCases = @(
        @{ n = 'guard: plain read of a command output is allowed'; tool = 'Bash'; cmd = "cat $taskFile"; want = 0 },
        @{ n = 'guard: until-loop on a command output is refused'; tool = 'Bash'; cmd = "until grep -q DONE $taskFile; do sleep 5; done"; want = 2 },
        @{ n = 'guard: Start-Sleep wait in PowerShell is refused'; tool = 'PowerShell'; cmd = "while (-not (Select-String DONE $taskFile)) { Start-Sleep 5 }"; want = 2 },
        @{ n = 'guard: Get-Content -Wait is refused'; tool = 'PowerShell'; cmd = "Get-Content $taskFile -Wait"; want = 2 },
        @{ n = 'guard: Monitor on a task output is refused'; tool = 'Monitor'; cmd = "grep -q DONE $taskFile"; want = 2 },
        @{ n = 'guard: any read of a subagent transcript is refused'; tool = 'Bash'; cmd = "tail -n 20 $agentFile"; want = 2 },
        @{ n = 'guard: a sleep without a task file is allowed'; tool = 'Bash'; cmd = 'until test -f temp/x; do sleep 1; done'; want = 0 },
        @{ n = 'guard: a tasks folder with no .output file is allowed'; tool = 'Bash'; cmd = 'while read l; do echo $l; done < PLAN/tasks/list.md'; want = 0 },
        @{ n = 'guard: another tool is allowed'; tool = 'Read'; cmd = "until $taskFile sleep"; want = 0 }
    )
    foreach ($c in $guardCases) {
        $r = Invoke-Hook 'guard-manual-task-wait.ps1' (ConvertTo-Payload @{ tool_name = $c.tool; tool_input = @{ command = $c.cmd } })
        Assert-Case $c.n ($r.Code -eq $c.want) "expected exit $($c.want), actual $($r.Code)"
    }
    $r = Invoke-Hook 'guard-manual-task-wait.ps1' (ConvertTo-Payload @{ tool_name = 'Bash'; tool_input = @{ command = "until grep -q X $taskFile; do sleep 5; done" } }) -Env @{ SZA_TASK_OUTPUT_OK = '1' }
    Assert-Case 'guard: escape hatch allows the wait' ($r.Code -eq 0) "expected exit 0, actual $($r.Code)"
    $r = Invoke-Hook 'guard-manual-task-wait.ps1' '{not json'
    Assert-Case 'guard: malformed payload fails open' ($r.Code -eq 0) "expected exit 0, actual $($r.Code)"
    $r = Invoke-Hook 'guard-manual-task-wait.ps1' (ConvertTo-Payload @{ tool_name = 'Bash'; tool_input = @{ command = "until grep -q X $taskFile; do sleep 5; done" } })
    Assert-Case 'guard: refusal names the escape hatch on stderr' ($r.Err -match 'SZA_TASK_OUTPUT_OK=1') "stderr: $($r.Err)"

    # --- observe-empty-grep ------------------------------------------------------------------------
    $tree = Join-Path $work 'tree'
    foreach ($d in 'src', 'docs', 'scratch') { New-Item -ItemType Directory -Force -Path (Join-Path $tree $d) | Out-Null }
    Set-Content -LiteralPath (Join-Path $tree '.ignore') -Value 'scratch/'
    Set-Content -LiteralPath (Join-Path $tree 'src/a.txt') -Value 'alpha_hit_s0041'
    Set-Content -LiteralPath (Join-Path $tree 'scratch/b.txt') -Value 'beta_hit_s0041'
    Set-Content -LiteralPath (Join-Path $tree 'docs/c.txt') -Value 'nothing here'
    $grepArgs = @('-RepoRoot', $tree)
    function New-GrepPayload([hashtable] $GrepInput, $Response) {
        return ConvertTo-Payload @{ tool_name = 'Grep'; tool_input = $GrepInput; tool_response = $Response }
    }
    $r = Invoke-Hook 'observe-empty-grep.ps1' (New-GrepPayload @{ pattern = 'alpha_hit_s0041'; path = 'docs' } 'No files found') $grepArgs
    Assert-Case 'grep: narrow path miss names the hit elsewhere' ($r.Code -eq 0 -and $r.Out -match 'src/a\.txt' -and $r.Out -match 'additionalContext') "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' (New-GrepPayload @{ pattern = 'beta_hit_s0041' } 'No matches found') $grepArgs
    Assert-Case 'grep: miss over an ignored tree names the ignored hit' ($r.Code -eq 0 -and $r.Out -match 'scratch/b\.txt' -and $r.Out -match 'gitignored') "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' (New-GrepPayload @{ pattern = 'beta_hit_s0041' } @{ mode = 'files_with_matches'; numFiles = 0; filenames = @() }) $grepArgs
    Assert-Case 'grep: structured zero count is read as empty' ($r.Out -match 'scratch/b\.txt') "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' (New-GrepPayload @{ pattern = 'gamma_absent_s0041'; path = 'docs' } 'No files found') $grepArgs
    Assert-Case 'grep: a true absence stays silent' ($r.Code -eq 0 -and [string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' (New-GrepPayload @{ pattern = 'alpha_hit_s0041'; path = 'src' } 'Found 1 file') $grepArgs
    Assert-Case 'grep: a non-empty result stays silent' ([string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' (New-GrepPayload @{ pattern = 'console\.debug\("S[0-9]{4}:' } 'No matches found') $grepArgs
    Assert-Case 'grep: the probe-tag sweep stays silent' ([string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' (ConvertTo-Payload @{ tool_name = 'Glob'; tool_input = @{ pattern = '*' }; tool_response = 'No files found' }) $grepArgs
    Assert-Case 'grep: another tool stays silent' ([string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"
    $r = Invoke-Hook 'observe-empty-grep.ps1' '{broken' $grepArgs
    Assert-Case 'grep: malformed payload stays silent' ($r.Code -eq 0 -and [string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"

    # --- refuse-unexplained-red-verdict ------------------------------------------------------------
    $facadeCmd = 'pwsh -NoProfile -File tools/post-change.ps1 -Files "web/a.js" -ChangeType fix -Target S0041 -Description "x"'
    function New-Use([string] $Id, [string] $Tool, [hashtable] $ToolInput) {
        return @{ type = 'assistant'; message = @{ role = 'assistant'; content = @(@{ type = 'tool_use'; id = $Id; name = $Tool; input = $ToolInput }) } }
    }
    function New-Result([string] $Id, [string] $Text, [bool] $IsError) {
        return @{ type = 'user'; message = @{ role = 'user'; content = @(@{ type = 'tool_result'; tool_use_id = $Id; is_error = $IsError; content = $Text }) } }
    }
    $prompt = @{ type = 'user'; message = @{ role = 'user'; content = 'fix it' } }
    function Write-Transcript([string] $Name, [object[]] $Rows) {
        $path = Join-Path $work "$Name.jsonl"
        [System.IO.File]::WriteAllLines($path, [string[]]@($Rows | ForEach-Object { $_ | ConvertTo-Json -Depth 12 -Compress }))
        return $path
    }
    $redRows = @($prompt, (New-Use 't1' 'PowerShell' @{ command = $facadeCmd }), (New-Result 't1' "Exit code 1`nPOST-CHANGE: FAIL (1 gates)" $true))
    $stopCases = @(
        @{ n = 'stop: an unread red facade verdict is refused'; rows = $redRows; block = $true },
        @{ n = 'stop: could-not-verify is refused too'; rows = @($prompt, (New-Use 't1' 'Bash' @{ command = $facadeCmd }), (New-Result 't1' "Exit code 2`nPOST-CHANGE: CANNOT VERIFY (empty set)" $true)); block = $true },
        @{ n = 'stop: a red verdict read back from a redirect file is refused'; rows = @($prompt, (New-Use 't1' 'PowerShell' @{ command = "$facadeCmd *> temp/S0041/pc.txt" }), (New-Result 't1' '' $false), (New-Use 't2' 'Read' @{ file_path = 'P:/r/temp/S0041/pc.txt' }), (New-Result 't2' 'POST-CHANGE: FAIL (2 gates)' $false)); block = $true },
        @{ n = 'stop: reading a gate output releases the turn'; rows = $redRows + @((New-Use 't2' 'Read' @{ file_path = 'P:/r/temp/post-change/web-hygiene.txt' }), (New-Result 't2' 'HYGIENE: FAIL' $false)); block = $false },
        @{ n = 'stop: a passing re-run releases the turn'; rows = $redRows + @((New-Use 't3' 'PowerShell' @{ command = $facadeCmd }), (New-Result 't3' 'POST-CHANGE: PASS WITH ADVISORIES (1)' $false)); block = $false },
        @{ n = 'stop: a red verdict from an earlier turn is ignored'; rows = $redRows + @(@{ type = 'user'; message = @{ role = 'user'; content = 'next task' } }); block = $false },
        @{ n = 'stop: a red result of another command is ignored'; rows = @($prompt, (New-Use 't1' 'Bash' @{ command = 'rg -n nothing web' }), (New-Result 't1' 'Exit code 1' $true)); block = $false },
        @{ n = 'stop: a passing facade run allows the stop'; rows = @($prompt, (New-Use 't1' 'PowerShell' @{ command = $facadeCmd }), (New-Result 't1' 'POST-CHANGE: PASS' $false)); block = $false }
    )
    $i = 0
    foreach ($c in $stopCases) {
        $i++
        $path = Write-Transcript "stop-$i" $c.rows
        $r = Invoke-Hook 'refuse-unexplained-red-verdict.ps1' (ConvertTo-Payload @{ session_id = 'x'; transcript_path = $path; stop_hook_active = $false })
        $blocked = $r.Out -match '"decision":"block"'
        Assert-Case $c.n ($r.Code -eq 0 -and $blocked -eq $c.block) "expected block=$($c.block), actual block=$blocked exit=$($r.Code) out=$($r.Out)"
    }
    $path = Write-Transcript 'stop-active' $redRows
    $r = Invoke-Hook 'refuse-unexplained-red-verdict.ps1' (ConvertTo-Payload @{ transcript_path = $path; stop_hook_active = $true })
    Assert-Case 'stop: a second stop after a refusal is allowed' ([string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"
    $r = Invoke-Hook 'refuse-unexplained-red-verdict.ps1' (ConvertTo-Payload @{ transcript_path = (Join-Path $work 'missing.jsonl') })
    Assert-Case 'stop: a missing transcript fails open' ($r.Code -eq 0 -and [string]::IsNullOrWhiteSpace($r.Out)) "out: $($r.Out)"

    # --- registration <-> inventory ----------------------------------------------------------------
    $settingsPath = Join-Path $repoRoot '.claude/settings.json'
    $inventoryPath = Join-Path $repoRoot 'docs/AGENT_HOOKS.md'
    $registered = @{}
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
    if ($null -ne $settings.PSObject.Properties['hooks']) {
        foreach ($ev in $settings.hooks.PSObject.Properties) {
            foreach ($group in @($ev.Value)) {
                foreach ($h in @($group.hooks)) {
                    foreach ($m in [regex]::Matches([string]$h.command, '[\w.\-]+\.ps1')) { $registered[$m.Value] = $ev.Name }
                }
            }
        }
    }
    $inventory = @{}
    $inHeading = $false
    if (Test-Path -LiteralPath $inventoryPath) {
        foreach ($line in Get-Content -LiteralPath $inventoryPath) {
            if ($line -match '^#{1,6}\s') { $inHeading = $line -match '(?i)^#{1,6}\s+inventory\b'; continue }
            if ($inHeading -and $line -match '^\s*\|') {
                foreach ($m in [regex]::Matches(($line -split '\|')[1], '[\w.\-]+\.ps1')) { $inventory[$m.Value] = $true }
            }
        }
    }
    $onDisk = @(Get-ChildItem -LiteralPath $hooksDir -Filter '*.ps1' -File | ForEach-Object Name)
    $missingRow = @($registered.Keys | Where-Object { -not $inventory.ContainsKey($_) })
    $unregistered = @($inventory.Keys | Where-Object { -not $registered.ContainsKey($_) })
    $noFile = @($registered.Keys | Where-Object { $onDisk -notcontains $_ })
    Assert-Case 'inventory: every registered hook has an inventory row' ($registered.Count -gt 0 -and $missingRow.Count -eq 0) "registered=$($registered.Count) missing rows: $($missingRow -join ', ')"
    Assert-Case 'inventory: every inventory row is registered' ($unregistered.Count -eq 0) "unregistered: $($unregistered -join ', ')"
    Assert-Case 'inventory: every registered hook exists on disk' ($noFile.Count -eq 0) "missing files: $($noFile -join ', ')"
}
catch {
    Write-Host "HOOK-TESTS: CANNOT VERIFY ($($_.Exception.Message))"
    exit 2
}
finally {
    if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
}

$failed = @($results | Where-Object { -not $_.Ok })
if ($failed.Count -gt 0) {
    Write-Host "HOOK-TESTS: FAIL ($($failed.Count) of $($results.Count) cases)"
    exit 1
}
Write-Host "HOOK-TESTS: PASS ($($results.Count) cases)"
exit 0
