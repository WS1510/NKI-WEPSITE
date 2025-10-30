# Rename files with non-ASCII characters to ASCII-safe names and update references
Set-Location -LiteralPath (Resolve-Path -LiteralPath .).ProviderPath
$files = Get-ChildItem -Recurse -File | Where-Object { $_.Name -match '[^\u0000-\u007F]' }
if (-not $files -or $files.Count -eq 0) {
    Write-Output "NO_MATCH"
    exit 0
}
$i = 1
$map = @{}
foreach ($f in $files) {
    $ext = $f.Extension
    $dir = $f.DirectoryName
    $new = "safe-$i$ext"
    $newPath = Join-Path $dir $new
    Write-Output "RENAME: $($f.FullName) -> $newPath"
    try {
        # Try git mv first (safer for git history)
        & git mv -f -- "${f.FullName}" "${newPath}" 2>$null
    } catch {
        # fallback to Move-Item if git mv fails
        Move-Item -LiteralPath $f.FullName -Destination $newPath -Force
    }
    $map[$f.Name] = $new
    $i++
}
# Update references in common text files
$targets = Get-ChildItem -Recurse -File -Include *.html,*.css,*.js,*.md,*.txt -ErrorAction SilentlyContinue
foreach ($old in $map.Keys) {
    $new = $map[$old]
    Write-Output "REPLACE: $old -> $new"
    foreach ($t in $targets) {
        try {
            $content = Get-Content -Raw -LiteralPath $t.FullName -ErrorAction Stop
            if ($content -match [regex]::Escape($old)) {
                $content = $content -replace [regex]::Escape($old), $new
                Set-Content -LiteralPath $t.FullName -Value $content
            }
        } catch {
            # ignore binary or unreadable files
        }
    }
}
# Commit & push
& git add -A
$commit = & git commit -m "Rename non-ASCII asset filenames to ASCII-safe names and update references" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output "NO_COMMIT: $commit"
} else {
    & git push origin main
}
