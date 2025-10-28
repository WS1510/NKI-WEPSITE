# Start-server.ps1
# Usage: Run this script to start the Node server in background with env from .env (if present) and redirect logs to server.log/server.err
# It reads a .env file with KEY=VALUE lines (optional) and exports them to the current process that starts the server.

param(
    [string]$EnvFile = '.env',
    [int]$DelayBeforeStart = 1
)

function Load-EnvFile($path) {
    if (-Not (Test-Path $path)) { return }
    Get-Content $path | ForEach-Object {
        $_ = $_.Trim()
        if (-not $_ -or $_.StartsWith('#')) { return }
        $parts = $_ -split '='; if ($parts.Count -lt 2) { return }
        $k = $parts[0].Trim(); $v = ($parts[1..($parts.Count-1)] -join '=').Trim(' "')
        Set-Item -Path "Env:$k" -Value $v
    }
}

# load .env if exists
Load-EnvFile -path $EnvFile
Start-Sleep -Seconds $DelayBeforeStart

# ensure log directory
$log = Join-Path $PWD 'server.log'
$err = Join-Path $PWD 'server.err'

# Start node in a new PowerShell to run in background and redirect output
$cmd = "$env:PATH; node .\index.js *> server.log 2>&1"
Start-Process -FilePath powershell -ArgumentList '-NoProfile','-Command',"node .\index.js *> server.log 2>&1" -PassThru | Out-Null
Write-Host "Started server in background. Logs: $log , $err"
Write-Host "Tip: Check logs with `Get-Content .\server.log -Tail 200`"