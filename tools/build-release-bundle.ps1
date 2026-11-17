<#
.SYNOPSIS
Builds the release bundle ZIP of served web/ files and SHA-256 checksums from a tag-derived version.
No git tag, upload, or GitHub release is performed by this script.
#>
[CmdletBinding()]
param(
    [string]$Tag = '',
    [string]$OutDir = 'dist',
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot 'web'
$licenseFile = Join-Path $repoRoot 'LICENSE'

if (-not (Test-Path -LiteralPath $webRoot -PathType Container)) {
    throw "Source root not found: $webRoot"
}

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $gitTag = (& git -C $repoRoot describe --tags --exact-match 2>$null)
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($gitTag)) {
        $Tag = $gitTag.Trim()
    } elseif ($DryRun) {
        $Tag = 'v0.0.0-dryrun'
    } else {
        throw 'No git tag on HEAD and -Tag was not provided. Pass -Tag <vX.Y.Z> or -DryRun.'
    }
}

$version = $Tag.Trim() -replace '^v', ''
if ([string]::IsNullOrWhiteSpace($version)) {
    throw "Derived version is empty from tag '$Tag'."
}

$bundleName = "FastMediaSorter-Web-$version.zip"
$resolvedOutDir = if ([System.IO.Path]::IsPathRooted($OutDir)) { $OutDir } else { Join-Path $repoRoot $OutDir }
$zipPath = Join-Path $resolvedOutDir $bundleName
$sumsPath = Join-Path $resolvedOutDir 'SHA256SUMS.txt'

$webFiles = Get-ChildItem -LiteralPath $webRoot -Recurse -File | Sort-Object FullName
$entries = @()
foreach ($f in $webFiles) {
    $rel = [System.IO.Path]::GetRelativePath($repoRoot, $f.FullName) -replace '\\', '/'
    $hash = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $entries += [PSCustomObject]@{
        RelativePath = $rel
        FullPath     = $f.FullName
        Sha256       = $hash
    }
}
if (Test-Path -LiteralPath $licenseFile -PathType Leaf) {
    $hash = (Get-FileHash -LiteralPath $licenseFile -Algorithm SHA256).Hash.ToLowerInvariant()
    $entries += [PSCustomObject]@{
        RelativePath = 'LICENSE'
        FullPath     = $licenseFile
        Sha256       = $hash
    }
}

if ($DryRun) {
    Write-Output "DRY-RUN: version=$version (tag=$Tag)"
    Write-Output "DRY-RUN: bundle=$zipPath"
    Write-Output "DRY-RUN: checksums=$sumsPath"
    Write-Output "DRY-RUN: files=$($entries.Count)"
    foreach ($e in $entries) {
        Write-Output "$($e.Sha256)  $($e.RelativePath)"
    }
    exit 0
}

New-Item -ItemType Directory -Force -Path $resolvedOutDir | Out-Null
$stageDir = Join-Path ([System.IO.Path]::GetTempPath()) ("fms-web-bundle-" + [System.Guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
    foreach ($e in $entries) {
        $dest = Join-Path $stageDir ($e.RelativePath -replace '/', '\')
        $destParent = Split-Path -Parent $dest
        New-Item -ItemType Directory -Force -Path $destParent | Out-Null
        Copy-Item -LiteralPath $e.FullPath -Destination $dest -Force
    }
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Compress-Archive -Path (Join-Path $stageDir '*') -DestinationPath $zipPath -CompressionLevel Optimal
    $zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()

    $lines = @("$zipHash  $bundleName")
    foreach ($e in $entries) {
        $lines += "$($e.Sha256)  $($e.RelativePath)"
    }
    Set-Content -LiteralPath $sumsPath -Value $lines -Encoding UTF8
    Write-Output "BUNDLE: PASS version=$version zip=$zipPath sha256=$zipHash files=$($entries.Count)"
} finally {
    if (Test-Path -LiteralPath $stageDir) {
        Remove-Item -LiteralPath $stageDir -Recurse -Force
    }
}
