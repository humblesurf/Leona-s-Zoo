# Native PowerShell only. Without -Execute this validates and reports; it never deletes.
[CmdletBinding()]
param(
    [switch]$Execute,
    [switch]$ArtworkAccepted,
    [switch]$VersionValidated,
    [switch]$PublishedLegacyOnly,
    [string]$PlanPath = (Join-Path $PSScriptRoot '../reviews/v4-13/cleanup-plan.json')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PathComparer = [System.StringComparer]::OrdinalIgnoreCase
$Workspace = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\', '/')
$WorkspacePrefix = $Workspace + [System.IO.Path]::DirectorySeparatorChar
$Deleted = [System.Collections.Generic.List[object]]::new()
$RunReport = [ordered]@{
    schema = 1
    mode = $(if ($Execute) { 'execute' } else { 'dry-run' })
    workspace = $Workspace
    startedUtc = [DateTime]::UtcNow.ToString('o')
    status = 'preflight'
    deletedTargets = $Deleted
}
$ReportPath = Join-Path $Workspace ('reviews/v4-13/cleanup-run-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff') + '.json')

function Get-SafeAbsolutePath {
    param([Parameter(Mandatory)][string]$Path, [switch]$MustExist)
    $absolute = [System.IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
    if ($PathComparer.Equals($absolute, $Workspace) -or -not $absolute.StartsWith($WorkspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe path outside workspace or equal to root: $Path"
    }
    if ($MustExist) {
        $resolved = (Resolve-Path -LiteralPath $absolute -ErrorAction Stop).ProviderPath
        $resolved = [System.IO.Path]::GetFullPath($resolved).TrimEnd('\', '/')
        if (-not $PathComparer.Equals($resolved, $absolute) -or -not $resolved.StartsWith($WorkspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Resolved path changed or escaped workspace: $Path -> $resolved"
        }
        $absolute = $resolved
    }
    # Reject actual symlinks/junctions, including any intermediate component.
    # OneDrive cloud placeholders may carry ReparsePoint with no LinkType;
    # those are normal files and are not treated as directory redirections.
    $probe = $absolute
    while ($probe.StartsWith($WorkspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        if (Test-Path -LiteralPath $probe) {
            $item = Get-Item -LiteralPath $probe -Force
            $linkProperty = $item.PSObject.Properties['LinkType']
            if ($null -ne $linkProperty -and $linkProperty.Value -in @('SymbolicLink', 'Junction')) {
                throw "Symlink/junction is not an approved cleanup target: $probe"
            }
        }
        $probe = Split-Path -Parent $probe
    }
    return $absolute
}

function Get-RelativePath {
    param([string]$Path)
    return [System.IO.Path]::GetRelativePath($Workspace, $Path).Replace('\', '/')
}

function Assert-FileStamp {
    param([object]$Record)
    $absolute = Get-SafeAbsolutePath -Path ([string]$Record.path) -MustExist
    $expected = Get-SafeAbsolutePath -Path (Join-Path $Workspace ([string]$Record.relativePath))
    if (-not $PathComparer.Equals($absolute, $expected)) {
        throw "Inventory absolute/relative path mismatch: $($Record.relativePath)"
    }
    $item = Get-Item -LiteralPath $absolute -Force
    if ($item.PSIsContainer) { throw "Expected file, found directory: $absolute" }
    $mtimeNs = [long](([decimal]$item.LastWriteTimeUtc.Ticks - [decimal]621355968000000000) * [decimal]100)
    if ([long]$item.Length -ne [long]$Record.bytes -or $mtimeNs -ne [long]$Record.mtimeNs) {
        throw "Candidate file was modified after audit: $absolute"
    }
    if ($null -ne $Record.safetyEvidence) {
        $sha = (Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($sha -ne [string]$Record.safetyEvidence.sha256) {
            throw "Duplicate-file content differs from SHA256 evidence: $absolute"
        }
    }
}

function Get-TreeInventory {
    param([string]$Directory)
    $fileList = [System.Collections.Generic.List[string]]::new()
    $directoryList = [System.Collections.Generic.List[string]]::new()
    $queue = [System.Collections.Generic.Queue[string]]::new()
    $queue.Enqueue((Get-SafeAbsolutePath -Path $Directory -MustExist))
    while ($queue.Count -gt 0) {
        $current = Get-SafeAbsolutePath -Path ($queue.Dequeue()) -MustExist
        $directoryList.Add((Get-RelativePath $current))
        foreach ($child in Get-ChildItem -LiteralPath $current -Force) {
            $safeChild = Get-SafeAbsolutePath -Path $child.FullName -MustExist
            if ($child.PSIsContainer) { $queue.Enqueue($safeChild) }
            else { $fileList.Add((Get-RelativePath $safeChild)) }
        }
    }
    return [pscustomobject]@{ Files = $fileList; Directories = $directoryList }
}

function Assert-Target {
    param([object]$Target)
    $absolute = Get-SafeAbsolutePath -Path ([string]$Target.path) -MustExist
    $expected = Get-SafeAbsolutePath -Path (Join-Path $Workspace ([string]$Target.relativePath))
    if (-not $PathComparer.Equals($absolute, $expected)) { throw "Target path mismatch: $absolute" }
    foreach ($protectedPath in $ProtectedPaths) {
        if ($PathComparer.Equals($absolute, $protectedPath) -or $protectedPath.StartsWith($absolute + '\', [System.StringComparison]::OrdinalIgnoreCase) -or $absolute.StartsWith($protectedPath + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Deletion target conflicts with protected path: $absolute -> $protectedPath"
        }
    }
    $item = Get-Item -LiteralPath $absolute -Force
    if ([string]$Target.type -eq 'directory') {
        if (-not $item.PSIsContainer) { throw "Expected directory: $absolute" }
        if ($null -eq $Target.PSObject.Properties['directories']) {
            throw "Audit must include original directory inventory: $absolute"
        }
        $tree = Get-TreeInventory $absolute
        $actualFiles = @($tree.Files | Sort-Object)
        $originalFiles = @($Target.files | Sort-Object)
        $actualDirectories = @($tree.Directories | Sort-Object)
        $originalDirectories = @($Target.directories | Sort-Object)
        $fileDifference = $actualFiles.Count -ne $originalFiles.Count
        if (-not $fileDifference -and $actualFiles.Count -gt 0) { $fileDifference = @((Compare-Object $actualFiles $originalFiles)).Count -gt 0 }
        $directoryDifference = $actualDirectories.Count -ne $originalDirectories.Count
        if (-not $directoryDifference -and $actualDirectories.Count -gt 0) { $directoryDifference = @((Compare-Object $actualDirectories $originalDirectories)).Count -gt 0 }
        if ($fileDifference -or $directoryDifference) {
            throw "Directory gained/lost files or directories after audit: $absolute"
        }
        foreach ($rel in $actualFiles) {
            if (-not $CandidateRecords.ContainsKey($rel)) { throw "Unaudited file below target: $rel" }
            Assert-FileStamp $CandidateRecords[$rel]
        }
    } elseif ([string]$Target.type -eq 'file') {
        if ($item.PSIsContainer) { throw "Expected file: $absolute" }
        $rel = [string]$Target.relativePath
        if (-not $CandidateRecords.ContainsKey($rel)) { throw "Target absent from original file inventory: $rel" }
        Assert-FileStamp $CandidateRecords[$rel]
    } else {
        throw "Unsupported deletion target type: $($Target.type)"
    }
    return $absolute
}

function Assert-ImmutableProtectedHashes {
    $verified = 0
    foreach ($record in $ProtectedRecords) {
        if ($record.mutableUntilV413Validated) { continue }
        $absolute = Get-SafeAbsolutePath -Path ([string]$record.path) -MustExist
        $item = Get-Item -LiteralPath $absolute -Force
        if ($item.PSIsContainer -or [long]$item.Length -ne [long]$record.bytes) {
            throw "Protected file missing/changed size: $absolute"
        }
        $sha = (Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($sha -ne [string]$record.sha256) { throw "Protected SHA256 mismatch: $absolute" }
        $verified++
    }
    return $verified
}

try {
    $workspaceItem = Get-Item -LiteralPath $Workspace -Force
    $workspaceLink = $workspaceItem.PSObject.Properties['LinkType']
    if ($null -ne $workspaceLink -and $workspaceLink.Value -in @('SymbolicLink', 'Junction')) { throw 'Workspace itself may not be a symlink/junction.' }
    $safePlan = Get-SafeAbsolutePath -Path ([System.IO.Path]::GetFullPath($PlanPath)) -MustExist
    $Plan = Get-Content -LiteralPath $safePlan -Raw | ConvertFrom-Json
    if ([int]$Plan.schema -lt 2 -or [string]$Plan.mode -ne 'READ_ONLY_AUDIT_NO_DELETION_PERFORMED' -or -not $PathComparer.Equals(([System.IO.Path]::GetFullPath([string]$Plan.workspace).TrimEnd('\', '/')), $Workspace)) {
        throw 'Cleanup plan schema/workspace/mode is not the approved read-only audit.'
    }
    if ($Execute -and (-not $PublishedLegacyOnly) -and (-not $ArtworkAccepted -or -not $VersionValidated)) {
        throw 'Execution requires completed artwork acceptance and final independent-game validation: -ArtworkAccepted -VersionValidated.'
    }
    if ($null -eq $Plan.runtimeV412ActiveDependencies -or -not $Plan.runtimeV412ActiveDependencies.allDependenciesWithinIndependentRuntime) {
        throw 'Protected V4.12 active-dependency audit has not passed.'
    }
    if ($PublishedLegacyOnly) {
        # Legacy publications are independent copies. Removing them does not
        # depend on acceptance of new drawings. Art sources/geo/caches remain.
        $isolationFile = Get-SafeAbsolutePath -Path (Join-Path $Workspace 'reviews/v4-13/source-isolation.json') -MustExist
        $isolation = Get-Content -LiteralPath $isolationFile -Raw | ConvertFrom-Json
        if (-not $isolation.completed -or -not $isolation.allActiveAssetsWithinRuntime -or $isolation.base -ne '4.12') { throw 'New source isolation proof is incomplete.' }
        $sourceIndex = Get-SafeAbsolutePath -Path (Join-Path $Workspace 'v4-13/index.html') -MustExist
        $baseIndex = Get-SafeAbsolutePath -Path (Join-Path $Workspace 'share/runtime-v4-12/index.html') -MustExist
        if ((Get-FileHash -LiteralPath $sourceIndex -Algorithm SHA256).Hash.ToLowerInvariant() -ne $isolation.indexSha256 -or (Get-FileHash -LiteralPath $baseIndex -Algorithm SHA256).Hash.ToLowerInvariant() -ne $isolation.baselineIndexSha256) { throw 'Source isolation proof is stale.' }
        $legacyPattern = '^share/(runtime-v(?:4|5|6)(?:-\d+){0,2}|Leonas-Zoo-v(?:4|5|6)(?:-\d+){0,2}\.(?:html|zip)|(?:build-share|build|test|zip-files)-v(?:4|5|6)(?:-\d+){0,2}\.(?:mjs|py|json))$'
        $Plan.deleteTargets = @($Plan.deleteTargets | Where-Object { $_.relativePath -match $legacyPattern })
        if ($Plan.deleteTargets.Count -eq 0) { throw 'No audited legacy publications selected.' }
        $RunReport['scope'] = 'audited legacy publications only; no art sources or geo assets'
    }
    $shaPath = Get-SafeAbsolutePath -Path ([string]$Plan.protectedSha256File) -MustExist
    $ProtectedRecords = @(Get-Content -LiteralPath $shaPath -Raw | ConvertFrom-Json)
    $ProtectedPaths = [System.Collections.Generic.List[string]]::new()
    foreach ($record in $ProtectedRecords) { $ProtectedPaths.Add((Get-SafeAbsolutePath -Path ([string]$record.path))) }
    foreach ($record in $Plan.protectedRoots) { $ProtectedPaths.Add((Get-SafeAbsolutePath -Path ([string]$record.path))) }
    $CandidateRecords = @{}
    foreach ($record in $Plan.deleteFilesInventory) {
        $rel = [string]$record.relativePath
        if ($CandidateRecords.ContainsKey($rel)) { throw "Duplicate candidate inventory record: $rel" }
        $CandidateRecords[$rel] = $record
    }
    $RunReport['protectedHashesVerifiedBefore'] = Assert-ImmutableProtectedHashes
    $validatedPaths = [System.Collections.Generic.HashSet[string]]::new($PathComparer)
    foreach ($target in $Plan.deleteTargets) {
        $safeTarget = Assert-Target $target
        foreach ($previous in $validatedPaths) {
            if ($safeTarget.StartsWith($previous + '\', [System.StringComparison]::OrdinalIgnoreCase) -or $previous.StartsWith($safeTarget + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "Overlapping deletion targets: $previous and $safeTarget"
            }
        }
        if (-not $validatedPaths.Add($safeTarget)) { throw "Duplicate deletion target: $safeTarget" }
    }
    $RunReport['validatedTargets'] = $validatedPaths.Count
    $RunReport['candidateFiles'] = $CandidateRecords.Count
    $RunReport['candidateBytes'] = [long]$Plan.totals.proposedDeleteBytes
    if ($PublishedLegacyOnly) {
        $publicationFiles = 0
        $publicationBytes = [long]0
        foreach ($target in $Plan.deleteTargets) {
            $publicationFiles += $(if ($target.type -eq 'directory') { @($target.files).Count } else { 1 })
            $publicationBytes += [long]$target.bytes
        }
        $RunReport['candidateFiles'] = $publicationFiles
        $RunReport['candidateBytes'] = $publicationBytes
    }
    Write-Host ('Preflight passed: {0} targets, {1} files, {2:N2} GiB; protected hashes verified: {3}.' -f $validatedPaths.Count, $RunReport['candidateFiles'], ([long]$RunReport['candidateBytes'] / 1GB), $RunReport['protectedHashesVerifiedBefore'])
    if (-not $Execute) {
        $RunReport['status'] = 'dry-run-passed-no-deletion'
        Write-Host 'Dry run only. No file or directory was deleted.'
    } else {
        if (-not $PublishedLegacyOnly) {
            $redirect = Get-Content -LiteralPath (Join-Path $Workspace 'geo/index.html') -Raw
            if ($redirect -notmatch '(?i)v4-13') { throw 'geo/index.html must redirect to V4.13 before removing its old source/assets.' }
        }
        if (-not (Test-Path -LiteralPath (Join-Path $Workspace 'v4-13/index.html') -PathType Leaf)) { throw 'V4.13 independent index.html is missing.' }
        # All targets have passed preflight. Recheck each immediately before its
        # own removal, so a new file/changed directory aborts without deleting it.
        foreach ($target in $Plan.deleteTargets) {
            $safeTarget = Assert-Target $target
            if ([string]$target.type -eq 'directory') {
                Remove-Item -LiteralPath $safeTarget -Recurse -Force -ErrorAction Stop
            } else {
                Remove-Item -LiteralPath $safeTarget -Force -ErrorAction Stop
            }
            $Deleted.Add([pscustomobject]@{ path = $safeTarget; bytes = [long]$target.bytes; completedUtc = [DateTime]::UtcNow.ToString('o') })
        }
        $RunReport['protectedHashesVerifiedAfter'] = Assert-ImmutableProtectedHashes
        $RunReport['status'] = 'completed-protected-hashes-verified'
        Write-Host ('Cleanup complete: {0} targets removed; all immutable protected hashes still match.' -f $Deleted.Count)
    }
} catch {
    $RunReport['status'] = $(if ($Deleted.Count -gt 0) { 'stopped-after-partial-cleanup' } else { 'rejected-no-deletion' })
    $RunReport['error'] = $_.Exception.Message
    Write-Error -Message ('Cleanup refused/stopped: ' + $_.Exception.Message) -ErrorAction Continue
    throw
} finally {
    $RunReport['finishedUtc'] = [DateTime]::UtcNow.ToString('o')
    # Writing an audit report is the only mutation performed during a dry run.
    $reportDirectory = Split-Path -Parent $ReportPath
    if (-not (Test-Path -LiteralPath $reportDirectory)) { New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null }
    $RunReport | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReportPath -Encoding utf8
    Write-Host ('Report: ' + $ReportPath)
}
