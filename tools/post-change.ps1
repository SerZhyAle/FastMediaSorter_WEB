#requires -Version 7.0
<#
.SYNOPSIS
    The one closure entry point of a change (S0039): runs the gates the changed set needs, in a fixed
    order, and only when all of them passed writes the dev-log row.

.DESCRIPTION
    Order, every applicable step before anything that writes:
      1. spec_catalog/validate                         always
      2. spec_catalog/release-queue -Validate          always
      3. py -3 tools/check-docs.py                     a .md file is in the set
      4. py -3 tools/contract-audit.py                 a file under docs/contracts/ is in the set
      5. py -3 tools/web-hygiene.py [--release]        a file under web/ or tests/ is in the set
      6. py -3 tools/locale-parity.py                  a file under web/ or tests/ is in the set
      7. py -3 tools/web-hygiene.py --self-test        tools/web-hygiene.py is in the set
      8. py -3 tools/locale-parity.py --self-test      tools/locale-parity.py is in the set
      9. tests/smoke.ps1 -SelfTest                     a file under tests/ is in the set
     10. tests/smoke.ps1 -Page <page>, every page of   a file under web/ or tests/ is in the set;
         the Release tier                              runs only with -Release - between releases each
                                                       page is an advisory naming its release command
                                                       (TESTING_AND_QA section 2, CLAUDE.md section 5)
    Then the dev-log row (ledger shape 2, `.sza-canon.json`): the harness writer
    devlog/add_to_dev_log, File = the first file of the set, Target = -Target, Description =
    "<ChangeType>: <Description> [set of <n>: <files>]". A recent identical row is reported as a
    duplicate and nothing is appended.

    Every gate's output goes to temp/post-change/<step>.txt and its verdict line is printed; the
    verdict of a step is its own exit code (0 pass, 1 fail, 2 or anything else could not verify).

.PARAMETER Files
    The changed set, one comma-separated string of repository-relative paths.

.EXAMPLE
    pwsh -NoProfile -File tools/post-change.ps1 -Files "web/app/sorting.js,web/app/strings.js" -ChangeType fix -Target S0024 -Description "Keep the destination after a refused move"
    pwsh -NoProfile -File tools/post-change.ps1 -Files "web/app/a.js" -ChangeType release -Target release -Description "Release check" -Release
    pwsh -NoProfile -File tools/post-change.ps1 -SelfTest

    Verdict line: POST-CHANGE: PASS | PASS WITH ADVISORIES (<n>) | FAIL (<n> gates) | CANNOT VERIFY (<reason>).
    Exit codes: 0 every applicable gate passed and the dev-log row was written or reported as a recent
    duplicate; 1 a gate failed - no row is written; 2 could not verify - a gate could not judge, the set
    is empty, or the dev-log could not be written (no row). -SelfTest: 0 every case passed
    (SELFTEST: PASS), 1 otherwise; it runs no gate and writes no row.
#>
[CmdletBinding()]
param(
    [string] $Files,
    [string] $Description,
    [ValidateSet('feature', 'fix', 'refactor', 'docs', 'tests', 'tooling', 'config', 'release')]
    [string] $ChangeType,
    [string] $Target,
    # Release scope: run the browser pages and ban ticket probes under web/.
    [switch] $Release,
    [switch] $SelfTest
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$releasePagesCommand = @('-NoProfile', '-File', (Join-Path $repoRoot 'tests/smoke.ps1'), '-ListTier', 'Release')

function ConvertTo-FileSet([string] $Csv) {
    , @($Csv -split ',' | ForEach-Object { ($_.Trim() -replace '\\', '/') -replace '^\./', '' } | Where-Object { $_ } | Select-Object -Unique)
}

function Get-ApplicableStep {
    # The ordered steps for a changed set. Each step: Name, Kind (gate | advisory), Exe, Arguments.
    param([string[]] $Set, [bool] $ReleaseScope, [string[]] $ReleasePages)
    $harness = Join-Path $repoRoot 'tools/harness.ps1'
    $steps = [System.Collections.Generic.List[object]]::new()
    $add = { param($name, $kind, $exe, $arguments) $steps.Add([pscustomobject]@{ Name = $name; Kind = $kind; Exe = $exe; Arguments = $arguments }) }
    $sourceOrTests = @($Set | Where-Object { $_ -like 'web/*' -or $_ -like 'tests/*' }).Count -gt 0
    & $add 'catalog-validate' 'gate' 'pwsh' @('-NoProfile', '-File', $harness, 'spec_catalog/validate')
    & $add 'release-queue-validate' 'gate' 'pwsh' @('-NoProfile', '-File', $harness, 'spec_catalog/release-queue', '-Validate')
    if (@($Set | Where-Object { $_ -like '*.md' }).Count -gt 0) {
        & $add 'check-docs' 'gate' 'py' @('-3', (Join-Path $repoRoot 'tools/check-docs.py'))
    }
    if (@($Set | Where-Object { $_ -like 'docs/contracts/*' }).Count -gt 0) {
        & $add 'contract-audit' 'gate' 'py' @('-3', (Join-Path $repoRoot 'tools/contract-audit.py'))
    }
    if ($sourceOrTests) {
        $hygiene = @('-3', (Join-Path $repoRoot 'tools/web-hygiene.py'))
        if ($ReleaseScope) { $hygiene += '--release' }
        & $add 'web-hygiene' 'gate' 'py' $hygiene
        & $add 'locale-parity' 'gate' 'py' @('-3', (Join-Path $repoRoot 'tools/locale-parity.py'))
    }
    if ($Set -contains 'tools/web-hygiene.py') {
        & $add 'web-hygiene-selftest' 'gate' 'py' @('-3', (Join-Path $repoRoot 'tools/web-hygiene.py'), '--self-test')
    }
    if ($Set -contains 'tools/locale-parity.py') {
        & $add 'locale-parity-selftest' 'gate' 'py' @('-3', (Join-Path $repoRoot 'tools/locale-parity.py'), '--self-test')
    }
    if (@($Set | Where-Object { $_ -like 'tests/*' }).Count -gt 0) {
        & $add 'smoke-selftest' 'gate' 'pwsh' @('-NoProfile', '-File', (Join-Path $repoRoot 'tests/smoke.ps1'), '-SelfTest')
    }
    if ($sourceOrTests) {
        foreach ($page in $ReleasePages) {
            $kind = if ($ReleaseScope) { 'gate' } else { 'advisory' }
            & $add "smoke $page" $kind 'pwsh' @('-NoProfile', '-File', (Join-Path $repoRoot 'tests/smoke.ps1'), '-Page', $page)
        }
    }
    $steps.ToArray()
}

function Invoke-GateProcess {
    # Runs one gate with its output in a file; returns @{ Code; Verdict }.
    param([Parameter(Mandatory)] $Step, [Parameter(Mandatory)][string] $LogDir)
    $log = Join-Path $LogDir (($Step.Name -replace '[^A-Za-z0-9.-]+', '_') + '.txt')
    & $Step.Exe @($Step.Arguments) *> $log
    $code = $LASTEXITCODE
    $lines = @(Get-Content -LiteralPath $log -Encoding utf8 -ErrorAction SilentlyContinue | Where-Object { $_.Trim() })
    $verdictLine = $lines | Where-Object { $_ -match '^(SELFTEST|SMOKE|HYGIENE|LOCALES|DOCS|AUDIT|CONTRACTS?|Summary|release-queue)\b' } | Select-Object -Last 1
    if (-not $verdictLine) { $verdictLine = $lines | Select-Object -Last 1 }
    @{ Code = $code; Verdict = [string]$verdictLine; Log = $log }
}

function Invoke-PostChange {
    # The ordering and the decision, separated from the processes so -SelfTest can drive them.
    # $RunStep: { param($step) -> @{ Code; Verdict } }; $WriteRow: { -> @{ State = written|duplicate|failed; Line } }.
    param([object[]] $Steps, [scriptblock] $RunStep, [scriptblock] $WriteRow)
    $failed = 0
    $unverified = 0
    $advisories = [System.Collections.Generic.List[string]]::new()
    foreach ($step in $Steps) {
        if ($step.Kind -eq 'advisory') {
            $command = "$($step.Exe) $(($step.Arguments | ForEach-Object { ($_ -replace [regex]::Escape($repoRoot + [IO.Path]::DirectorySeparatorChar), '') -replace '\\', '/' }) -join ' ')"
            $advisories.Add("RELEASE: $command")
            Write-Output "  [RELEASE] $($step.Name): not run between releases - $command"
            continue
        }
        $result = & $RunStep $step
        $state = switch ($result.Code) { 0 { 'PASS' } 1 { 'FAIL' } default { 'CANNOT VERIFY' } }
        if ($state -eq 'FAIL') { $failed++ } elseif ($state -ne 'PASS') { $unverified++ }
        Write-Output "  [$state] $($step.Name) (exit $($result.Code)): $($result.Verdict)"
    }
    if ($failed -gt 0) {
        Write-Output "POST-CHANGE: FAIL ($failed gates) - no dev-log row written"
        return 1
    }
    if ($unverified -gt 0) {
        Write-Output "POST-CHANGE: CANNOT VERIFY ($unverified gates could not judge) - no dev-log row written"
        return 2
    }
    $row = & $WriteRow
    Write-Output "  [dev-log] $($row.State): $($row.Line)"
    if ($row.State -eq 'failed') {
        Write-Output 'POST-CHANGE: CANNOT VERIFY (the dev-log row could not be written)'
        return 2
    }
    if ($advisories.Count -gt 0) {
        Write-Output "POST-CHANGE: PASS WITH ADVISORIES ($($advisories.Count))"
    } else {
        Write-Output 'POST-CHANGE: PASS'
    }
    return 0
}

if ($SelfTest) {
    $script:failures = 0
    $script:cases = 0
    function Test-Case([string] $Name, [bool] $Ok, [string] $Detail) {
        $script:cases++
        if ($Ok) { Write-Host "ok $Name" } else { $script:failures++; Write-Host "FAIL $Name ($Detail)" }
    }
    $pages = @('tests/a.html', 'tests/b.html')
    $names = { param($set, $rel) (Get-ApplicableStep -Set $set -ReleaseScope $rel -ReleasePages $pages | ForEach-Object { "$($_.Kind):$($_.Name)" }) -join ',' }

    $got = & $names @('tools/x.ps1') $false
    Test-Case 'selection: a script alone runs the two catalog gates' ($got -eq 'gate:catalog-validate,gate:release-queue-validate') $got
    $got = & $names @('CLAUDE.md') $false
    Test-Case 'selection: a .md adds check-docs' ($got -eq 'gate:catalog-validate,gate:release-queue-validate,gate:check-docs') $got
    $got = & $names @('docs/contracts/X.md') $false
    Test-Case 'selection: a contract pointer adds check-docs then contract-audit' ($got -eq 'gate:catalog-validate,gate:release-queue-validate,gate:check-docs,gate:contract-audit') $got
    $got = & $names @('web/app/a.js') $false
    Test-Case 'selection: web/ adds hygiene, locales and release-page advisories' ($got -eq 'gate:catalog-validate,gate:release-queue-validate,gate:web-hygiene,gate:locale-parity,advisory:smoke tests/a.html,advisory:smoke tests/b.html') $got
    $got = & $names @('tests/a.js') $true
    Test-Case 'selection: tests/ under -Release runs the smoke self-test and every page' ($got -eq 'gate:catalog-validate,gate:release-queue-validate,gate:web-hygiene,gate:locale-parity,gate:smoke-selftest,gate:smoke tests/a.html,gate:smoke tests/b.html') $got
    $hygieneArgs = (Get-ApplicableStep -Set @('web/a.js') -ReleaseScope $true -ReleasePages @() | Where-Object Name -eq 'web-hygiene').Arguments
    Test-Case 'selection: -Release bans probes in the hygiene gate' ($hygieneArgs -contains '--release') ($hygieneArgs -join ' ')
    $got = & $names @('tools/web-hygiene.py', 'tools/locale-parity.py') $false
    Test-Case 'selection: a gate script adds its own self-test' ($got -eq 'gate:catalog-validate,gate:release-queue-validate,gate:web-hygiene-selftest,gate:locale-parity-selftest') $got

    $steps = @(Get-ApplicableStep -Set @('web/app/a.js', 'README.md') -ReleaseScope $false -ReleasePages $pages)
    $decision = {
        param([hashtable] $codes, [string] $rowState)
        $calls = [System.Collections.Generic.List[string]]::new()
        $run = { param($step) $calls.Add($step.Name); $code = if ($codes.ContainsKey($step.Name)) { $codes[$step.Name] } else { 0 }; @{ Code = $code; Verdict = "stub $code" } }.GetNewClosure()
        $write = { $calls.Add('dev-log'); @{ State = $rowState; Line = 'stub row' } }.GetNewClosure()
        $out = @(Invoke-PostChange -Steps $steps -RunStep $run -WriteRow $write)
        @{ Exit = $out[-1]; Verdict = ($out | Where-Object { $_ -is [string] -and $_ -like 'POST-CHANGE:*' } | Select-Object -Last 1); Calls = ($calls -join ',') }
    }
    $order = 'catalog-validate,release-queue-validate,check-docs,web-hygiene,locale-parity'

    $r = & $decision @{} 'written'
    Test-Case 'decision: every gate in order, then the row' ($r.Calls -eq "$order,dev-log") $r.Calls
    Test-Case 'decision: skipped release pages are advisories' ($r.Exit -eq 0 -and $r.Verdict -eq 'POST-CHANGE: PASS WITH ADVISORIES (2)') "$($r.Exit) $($r.Verdict)"
    $r = & $decision @{ 'check-docs' = 1 } 'written'
    Test-Case 'decision: a failed gate writes no row, exit 1' ($r.Exit -eq 1 -and $r.Calls -eq $order -and $r.Verdict -like 'POST-CHANGE: FAIL (1 gates)*') "$($r.Exit) $($r.Calls) $($r.Verdict)"
    $r = & $decision @{ 'locale-parity' = 2 } 'written'
    Test-Case 'decision: an unverifiable gate writes no row, exit 2' ($r.Exit -eq 2 -and $r.Calls -eq $order -and $r.Verdict -like 'POST-CHANGE: CANNOT VERIFY*') "$($r.Exit) $($r.Calls) $($r.Verdict)"
    $r = & $decision @{ 'web-hygiene' = 1; 'locale-parity' = 2 } 'written'
    Test-Case 'decision: a failure outranks could-not-verify' ($r.Exit -eq 1) "$($r.Exit) $($r.Verdict)"
    $r = & $decision @{ 'catalog-validate' = 137 } 'written'
    Test-Case 'decision: an unknown exit code is could-not-verify' ($r.Exit -eq 2) "$($r.Exit) $($r.Verdict)"
    $r = & $decision @{} 'duplicate'
    Test-Case 'decision: a recent duplicate row still passes' ($r.Exit -eq 0 -and $r.Calls -eq "$order,dev-log") "$($r.Exit) $($r.Calls)"
    $r = & $decision @{} 'failed'
    Test-Case 'decision: a row that could not be written is exit 2' ($r.Exit -eq 2 -and $r.Verdict -like 'POST-CHANGE: CANNOT VERIFY*') "$($r.Exit) $($r.Verdict)"
    $plain = @(Get-ApplicableStep -Set @('tools/x.ps1') -ReleaseScope $false -ReleasePages $pages)
    $out = @(Invoke-PostChange -Steps $plain -RunStep { param($s) @{ Code = 0; Verdict = 'ok' } } -WriteRow { @{ State = 'written'; Line = 'row' } })
    Test-Case 'decision: no advisory is a plain PASS' ($out[-1] -eq 0 -and ($out -contains 'POST-CHANGE: PASS')) ($out -join ' | ')

    $state = if ($script:failures -eq 0) { 'PASS' } else { 'FAIL' }
    Write-Host "SELFTEST: $state ($script:cases cases, $script:failures failed)"
    exit ([int]($script:failures -ne 0))
}

if ([string]::IsNullOrWhiteSpace($Files) -or [string]::IsNullOrWhiteSpace($Description) -or [string]::IsNullOrWhiteSpace($ChangeType)) {
    Write-Host 'POST-CHANGE: CANNOT VERIFY (usage: -Files "<a,b>" -ChangeType <type> -Description "<text>" [-Target <name>] [-Release])'
    exit 2
}
$set = ConvertTo-FileSet $Files
if ($set.Count -eq 0) {
    Write-Host 'POST-CHANGE: CANNOT VERIFY (the changed set is empty)'
    exit 2
}
if (-not $Target) { $Target = $ChangeType }

$releasePages = @()
if (@($set | Where-Object { $_ -like 'web/*' -or $_ -like 'tests/*' }).Count -gt 0) {
    $releasePages = @(& pwsh @releasePagesCommand 2>$null)
    if ($LASTEXITCODE -ne 0 -or $releasePages.Count -eq 0) {
        Write-Host "POST-CHANGE: CANNOT VERIFY (tests/smoke.ps1 -ListTier Release exited $LASTEXITCODE with $($releasePages.Count) pages)"
        exit 2
    }
}

$logDir = Join-Path $repoRoot 'temp/post-change'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$missing = @($set | Where-Object { -not (Test-Path -LiteralPath (Join-Path $repoRoot $_)) })
Write-Host "post-change: $($set.Count) files, change type $ChangeType$(if ($Release) { ', release scope' })"
foreach ($path in $missing) { Write-Host "  note: $path is not on disk (a deletion is judged by the gates of its area)" }

$steps = @(Get-ApplicableStep -Set $set -ReleaseScope $Release.IsPresent -ReleasePages $releasePages)
$runStep = { param($step) Invoke-GateProcess -Step $step -LogDir $logDir }
$writeRow = {
    $setTail = "[set of $($set.Count): $($set -join ', ')]"
    $rowLog = Join-Path $logDir 'dev-log.txt'
    & pwsh -NoProfile -File (Join-Path $repoRoot 'tools/harness.ps1') 'devlog/add_to_dev_log' $set[0] $Target "${ChangeType}: $Description $setTail" *> $rowLog
    $code = $LASTEXITCODE
    $text = (Get-Content -LiteralPath $rowLog -Raw -Encoding utf8 -ErrorAction SilentlyContinue) -replace '\s+$', ''
    if ($code -ne 0) { return @{ State = 'failed'; Line = "writer exit $code - $text" } }
    if ($text -match 'SKIP duplicate') { return @{ State = 'duplicate'; Line = 'a recent identical row exists; nothing appended' } }
    if ($text -match 'NOT APPLICABLE') { return @{ State = 'failed'; Line = "no dev-log is configured although the stamp declares ledger shape 2 - $text" } }
    if ($text -match '^\[DEV_LOG\] \d{4}-') { return @{ State = 'written'; Line = $text } }
    @{ State = 'failed'; Line = "unrecognised writer output - $text" }
}
$output = @(Invoke-PostChange -Steps $steps -RunStep $runStep -WriteRow $writeRow)
$output | Where-Object { $_ -is [string] } | ForEach-Object { Write-Host $_ }
exit ([int]$output[-1])
