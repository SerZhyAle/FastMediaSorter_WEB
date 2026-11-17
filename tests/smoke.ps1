#requires -Version 7.0
<#
.SYNOPSIS
    Runs one browser test page of the static stack and fails on the page's verdict.

.DESCRIPTION
    The stack decision (owner, 2026-10-16, ticket S0003) is static HTML, CSS and ES modules with
    no build step, and the workstation carries no Node - so a test is a static page under tests/
    and this script is the test command (CLAUDE.md section 5).

    It serves the repository root over 127.0.0.1 with Python's http.server (through the `py`
    launcher; ES modules do not load over file:), opens the page in headless Chrome or Edge
    (first found), dumps the rendered DOM and reads the verdict line the page writes into its
    #results element: "SMOKE: PASS (<n> checks)" or "SMOKE: FAIL". By hand, the same page in any
    current browser shows the same line.

    A PASS must prove the page judged something (S0039): the page's test module declares
    `const declaredChecks = <n>;`, and the PASS line must report exactly that many executed checks.
    A module without the declaration, or a PASS reporting zero checks, is "could not verify"; a PASS
    reporting another count is a FAIL.

    The browser run is bounded by a wall-clock ceiling (-TimeoutSeconds). On expiry the browser
    process tree this script started is stopped and the run is "could not verify", never FAIL.

    The server and the browser profile are scratch: the server is stopped and the temporary
    profile directory removed before this script exits.

.EXAMPLE
    pwsh -NoProfile -File tests/smoke.ps1
    pwsh -NoProfile -File tests/smoke.ps1 -Page tests/smoke.html
    pwsh -NoProfile -File tests/smoke.ps1 -ListTier Release
    pwsh -NoProfile -File tests/smoke.ps1 -SelfTest

    Exit codes: 0 = the page reported SMOKE: PASS with every declared check executed;
    1 = it reported SMOKE: FAIL, a PASS with a count other than the declared one, or no verdict
    (page error, the page did not finish); 2 = could not verify - bad invocation, an empty tier, a
    page module without its declared count, a PASS that executed nothing, no browser, the local
    server did not come up, or the wall-clock ceiling expired.
    A tier listing exits 0 only when it prints at least one page. -SelfTest exits 0 when every
    case passed (SELFTEST: PASS), 1 otherwise; it starts no browser.
#>
[CmdletBinding()]
param(
    # Test page, relative to the repository root.
    [string] $Page = 'tests/smoke.html',

    # Print the measured tier's page paths without starting a browser.
    [ValidateSet('Fast', 'Release')]
    [string] $ListTier,

    # Port for the local server; 0 picks a free one.
    [int] $Port = 0,

    # Virtual milliseconds the headless browser lets the page run before dumping the DOM.
    [int] $VirtualTimeBudgetMs = 10000,

    # Wall-clock ceiling of the browser run, in seconds; expiry exits 2.
    [int] $TimeoutSeconds = 60,

    # Run the verdict, declared-count and timeout cases without a browser.
    [switch] $SelfTest
)

$ErrorActionPreference = 'Stop'
$tiers = @{
    Fast = @()
    Release = @('tests/smoke.html', 'tests/shell.html', 'tests/local.html', 'tests/images.html', 'tests/help.html', 'tests/diagnostic.html', 'tests/admin.html')
}
$repoRoot = Split-Path -Parent $PSScriptRoot

function Get-DeclaredCheckCount {
    # The count the page's own test module declares; $null when the page or its module carries none.
    param([Parameter(Mandatory)][string] $PageFile)
    $html = Get-Content -LiteralPath $PageFile -Raw -Encoding utf8
    $script = [regex]::Match($html, '<script\b[^>]*\btype\s*=\s*"module"[^>]*\bsrc\s*=\s*"(?<src>[^"]+)"')
    if (-not $script.Success) { return $null }
    $modulePath = Join-Path (Split-Path -Parent $PageFile) ($script.Groups['src'].Value -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $modulePath -PathType Leaf)) { return $null }
    $declared = [regex]::Match((Get-Content -LiteralPath $modulePath -Raw -Encoding utf8), '(?m)^const declaredChecks = (?<n>\d+);')
    if (-not $declared.Success) { return $null }
    return [int]$declared.Groups['n'].Value
}

function Get-SmokeVerdict {
    # Judges a dumped DOM against the declared count: @{ Code = 0|1|2; Line = <text to print> }.
    param([string] $Dom, [Parameter(Mandatory)][int] $Declared)
    $fail = [regex]::Match([string]$Dom, 'SMOKE: FAIL\b[^\r\n<]*').Value
    if ($fail) { return @{ Code = 1; Line = $fail } }
    $pass = [regex]::Match([string]$Dom, 'SMOKE: PASS\b[^\r\n<]*')
    if (-not $pass.Success) {
        return @{ Code = 1; Line = 'No SMOKE verdict in the dumped DOM - the page did not finish, or did not load.' }
    }
    $counted = [regex]::Match($pass.Value, '^SMOKE: PASS \((?<n>\d+) checks?\)')
    if (-not $counted.Success) {
        return @{ Code = 1; Line = "SMOKE: FAIL (the PASS line reports no executed-check count: '$($pass.Value)')" }
    }
    $executed = [int]$counted.Groups['n'].Value
    if ($executed -eq 0) {
        return @{ Code = 2; Line = 'SMOKE: CANNOT VERIFY (the page executed no check)' }
    }
    if ($executed -ne $Declared) {
        return @{ Code = 1; Line = "SMOKE: FAIL ($executed checks executed, $Declared declared)" }
    }
    return @{ Code = 0; Line = $pass.Value }
}

function Invoke-BoundedProcess {
    # Starts a process with stdout captured to a file and waits at most $Seconds. On expiry the
    # whole process tree this function started is stopped. Returns @{ TimedOut; Output }.
    param(
        [Parameter(Mandatory)][string] $FilePath,
        [Parameter(Mandatory)][string[]] $ArgumentList,
        [Parameter(Mandatory)][int] $Seconds,
        [Parameter(Mandatory)][string] $OutputFile
    )
    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $OutputFile -RedirectStandardError "$OutputFile.err"
    try {
        if (-not $process.WaitForExit($Seconds * 1000)) {
            $process.Kill($true)
            $process.WaitForExit(10000) | Out-Null
            return @{ TimedOut = $true; Output = ''; ProcessId = $process.Id }
        }
        $process.WaitForExit()
        $text = if (Test-Path -LiteralPath $OutputFile) { Get-Content -LiteralPath $OutputFile -Raw -Encoding utf8 } else { '' }
        return @{ TimedOut = $false; Output = [string]$text; ProcessId = $process.Id }
    }
    finally {
        Remove-Item -LiteralPath $OutputFile, "$OutputFile.err" -Force -ErrorAction SilentlyContinue
    }
}

if ($SelfTest) {
    $failures = 0
    $cases = 0
    function Test-Case([string] $Name, [bool] $Ok, [string] $Detail) {
        $script:cases++
        if ($Ok) { Write-Host "ok $Name" } else { $script:failures++; Write-Host "FAIL $Name ($Detail)" }
    }
    $verdictCases = @(
        @{ Name = 'PASS with every declared check'; Dom = '<pre>ok a\nSMOKE: PASS (3 checks)</pre>'; Declared = 3; Code = 0 },
        @{ Name = 'PASS with fewer executed than declared'; Dom = '<pre>SMOKE: PASS (2 checks)</pre>'; Declared = 3; Code = 1 },
        @{ Name = 'PASS with zero executed'; Dom = '<pre>SMOKE: PASS (0 checks)</pre>'; Declared = 3; Code = 2 },
        @{ Name = 'PASS without a count'; Dom = '<pre>SMOKE: PASS</pre>'; Declared = 3; Code = 1 },
        @{ Name = 'FAIL line'; Dom = '<pre>SMOKE: FAIL (1 failed, 3 of 3 executed)</pre>'; Declared = 3; Code = 1 },
        @{ Name = 'no verdict'; Dom = '<pre>loading</pre>'; Declared = 3; Code = 1 },
        @{ Name = 'empty DOM'; Dom = ''; Declared = 3; Code = 1 }
    )
    foreach ($case in $verdictCases) {
        $verdict = Get-SmokeVerdict -Dom $case.Dom -Declared $case.Declared
        Test-Case "verdict: $($case.Name)" ($verdict.Code -eq $case.Code) "exit $($verdict.Code), expected $($case.Code): $($verdict.Line)"
    }
    foreach ($releasePage in $tiers.Release) {
        $declared = Get-DeclaredCheckCount -PageFile (Join-Path $repoRoot $releasePage)
        Test-Case "declared count: $releasePage" ($null -ne $declared -and $declared -gt 0) "declared: '$declared'"
    }
    $scratch = Join-Path $repoRoot "temp/S0039/smoke-selftest-$PID"
    New-Item -ItemType Directory -Force -Path $scratch | Out-Null
    try {
        $noDeclaration = Join-Path $scratch 'page.html'
        Set-Content -LiteralPath $noDeclaration -Value '<script type="module" src="page.js"></script>' -Encoding utf8
        Set-Content -LiteralPath (Join-Path $scratch 'page.js') -Value "document.title = 'x';" -Encoding utf8
        Test-Case 'declared count: module without a declaration' ($null -eq (Get-DeclaredCheckCount -PageFile $noDeclaration)) 'a count was read'

        $pwsh = (Get-Process -Id $PID).Path
        $started = Get-Date
        $bounded = Invoke-BoundedProcess -FilePath $pwsh -ArgumentList @('-NoProfile', '-Command', 'Start-Sleep -Seconds 30') `
            -Seconds 1 -OutputFile (Join-Path $scratch 'sleep.out')
        $elapsed = ((Get-Date) - $started).TotalSeconds
        $alive = $null -ne (Get-Process -Id $bounded.ProcessId -ErrorAction SilentlyContinue)
        Test-Case 'timeout: a hung process is stopped at the ceiling' ($bounded.TimedOut -and -not $alive -and $elapsed -lt 15) "timedOut=$($bounded.TimedOut) alive=$alive elapsed=$([math]::Round($elapsed, 1))s"

        $quick = Invoke-BoundedProcess -FilePath $pwsh -ArgumentList @('-NoProfile', '-Command', "Write-Output 'SMOKE: PASS (1 checks)'") `
            -Seconds 30 -OutputFile (Join-Path $scratch 'quick.out')
        Test-Case 'timeout: a finished process returns its output' ((-not $quick.TimedOut) -and $quick.Output -match 'SMOKE: PASS') "timedOut=$($quick.TimedOut) output='$($quick.Output.Trim())'"
    }
    finally {
        Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
    }
    $state = if ($failures -eq 0) { 'PASS' } else { 'FAIL' }
    Write-Host "SELFTEST: $state ($cases cases, $failures failed)"
    exit ([int]($failures -ne 0))
}

if ($ListTier) {
    if ($PSBoundParameters.ContainsKey('Page')) {
        Write-Host 'Choose a tier listing or a page, not both.'
        exit 2
    }
    $pages = @($tiers[$ListTier])
    if ($pages.Count -eq 0) {
        Write-Host "No pages are classified in the $ListTier tier."
        exit 2
    }
    $pages | ForEach-Object { Write-Output $_ }
    exit 0
}
$pagePath = Join-Path $repoRoot ($Page -replace '/', [IO.Path]::DirectorySeparatorChar)
if (-not (Test-Path -LiteralPath $pagePath)) {
    Write-Host "No such test page under the repository: $Page"
    exit 2
}
$declaredChecks = Get-DeclaredCheckCount -PageFile $pagePath
if ($null -eq $declaredChecks -or $declaredChecks -le 0) {
    Write-Host "SMOKE: CANNOT VERIFY ($Page has no module declaring 'const declaredChecks = <n>;')"
    exit 2
}

$browsers = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $browsers | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $browser) {
    Write-Host 'SMOKE: CANNOT VERIFY (neither Chrome nor Edge was found in the Program Files paths)'
    exit 2
}

if ($Port -le 0) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $Port = ($listener.LocalEndpoint).Port
    $listener.Stop()
}

$server = Start-Process -FilePath 'py' `
    -ArgumentList @('-m', 'http.server', "$Port", '--bind', '127.0.0.1', '--directory', $repoRoot) `
    -PassThru -WindowStyle Hidden
$profileDir = Join-Path ([IO.Path]::GetTempPath()) "fms-web-smoke-$PID"

try {
    $ready = $false
    foreach ($attempt in 1..50) {
        if ($server.HasExited) { break }
        try {
            $probe = [System.Net.Sockets.TcpClient]::new('127.0.0.1', $Port)
            $probe.Close()
            $ready = $true
            break
        } catch {
            Start-Sleep -Milliseconds 100
        }
    }
    if (-not $ready) {
        Write-Host "SMOKE: CANNOT VERIFY (the local server on port $Port did not come up: py -m http.server)"
        exit 2
    }

    $url = "http://127.0.0.1:$Port/$($Page -replace '\\', '/')"
    $run = Invoke-BoundedProcess -FilePath $browser -Seconds $TimeoutSeconds -OutputFile (Join-Path ([IO.Path]::GetTempPath()) "fms-web-smoke-$PID.dom") -ArgumentList @(
        '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        "--user-data-dir=`"$profileDir`"",
        "--virtual-time-budget=$VirtualTimeBudgetMs",
        '--dump-dom', $url
    )
    if ($run.TimedOut) {
        Write-Host "SMOKE: CANNOT VERIFY (the browser did not finish within $TimeoutSeconds s and was stopped: $url)"
        exit 2
    }

    $verdict = Get-SmokeVerdict -Dom $run.Output -Declared $declaredChecks
    if ($verdict.Code -eq 0) {
        Write-Host "$($verdict.Line) ($browser, $url)"
    } else {
        Write-Host "$($verdict.Line) ($url)"
    }
    exit $verdict.Code
}
finally {
    if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $profileDir) {
        Remove-Item -LiteralPath $profileDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
