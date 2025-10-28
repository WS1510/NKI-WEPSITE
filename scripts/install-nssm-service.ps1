# install-nssm-service.ps1
# Usage (run as Administrator in PowerShell):
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
#   .\scripts\install-nssm-service.ps1 -ServiceName nki-server -AppPath (Resolve-Path .) -NodeExe (Get-Command node).Source

param(
    [string]$ServiceName = 'nki-server',
    [string]$AppPath = (Resolve-Path .).Path,
    [string]$NodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source,
    [string]$EnvFile = '.env'
)

function Ensure-Admin {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error 'This script must be run as Administrator. Open PowerShell as Administrator and re-run.'
        exit 1
    }
}

function Download-Nssm($destDir) {
    $nssmUrl = 'https://nssm.cc/release/nssm-2.24.zip'
    $zip = Join-Path $destDir 'nssm.zip'
    $outDir = Join-Path $destDir 'nssm'
    if (-Not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir | Out-Null
    }
    Write-Host "Downloading NSSM from $nssmUrl to $zip ..."
    Invoke-WebRequest -Uri $nssmUrl -OutFile $zip -UseBasicParsing
    Write-Host 'Extracting...'
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zip, $outDir)
    Remove-Item $zip -Force
    # try to find the 64-bit binary
    $bin = Get-ChildItem -Path $outDir -Recurse -Filter 'nssm.exe' | Where-Object { $_.FullName -match 'win64' } | Select-Object -First 1
    if (-not $bin) { $bin = Get-ChildItem -Path $outDir -Recurse -Filter 'nssm.exe' | Select-Object -First 1 }
    if (-not $bin) { Write-Error 'Failed to extract nssm.exe' ; exit 1 }
    return $bin.FullName
}

Ensure-Admin

if (-not $NodeExe) {
    Write-Error 'node executable not found in PATH. Install Node.js or provide -NodeExe path.'
    exit 1
}

Write-Host "Installing service '$ServiceName' for app at: $AppPath using node: $NodeExe"

$tools = Join-Path $env:TEMP 'nssm-tools'
if (-not (Test-Path $tools)) { New-Item -ItemType Directory -Path $tools | Out-Null }
$nssmExe = Download-Nssm -destDir $tools

# Build arguments
$appJs = Join-Path $AppPath 'index.js'
if (-not (Test-Path $appJs)) { Write-Error "Cannot find $appJs"; exit 1 }

Write-Host "Using nssm at: $nssmExe"

# Install service
& $nssmExe install $ServiceName $NodeExe $appJs

# Optionally set working directory
& $nssmExe set $ServiceName AppDirectory $AppPath

# If you have a .env file, set it as AppEnvironmentExtra as a simple semicolon-separated string
if (Test-Path $EnvFile) {
    $lines = Get-Content $EnvFile | Where-Object { $_ -and -not $_.StartsWith('#') }
    $pairs = @()
    foreach ($l in $lines) {
        $parts = $l -split '='; if ($parts.Count -lt 2) { continue }
        $k = $parts[0].Trim(); $v = ($parts[1..($parts.Count-1)] -join '=').Trim(' "')
        $pairs += "$k=$v"
    }
    if ($pairs.Count) {
        $envString = ($pairs -join "\n")
        # nssm accepts AppEnvironmentExtra as multiple lines
        & $nssmExe set $ServiceName AppEnvironmentExtra $envString
        Write-Host 'Environment variables set for service.'
    }
}

# Set service to auto-start
& $nssmExe set $ServiceName Start SERVICE_AUTO_START

Write-Host "Service '$ServiceName' installed. Starting service..."
Start-Service -Name $ServiceName
Start-Sleep -Seconds 2
Get-Service -Name $ServiceName | Format-List Name,Status,StartType

Write-Host "Done. Check logs (server.log / server.err) and PM2 is not used in this flow. To remove the service: nssm remove $ServiceName confirm"
