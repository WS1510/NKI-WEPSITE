# healthcheck.ps1
# Simple healthcheck script: posts a small test or queries DB count and returns non-zero exit on failure.
param(
    [string]$BaseUrl = 'http://localhost:3000',
    [int]$MaxRetries = 1
)

# 1) HTTP GET simple endpoint (if you had one). We'll use a GET to /api/quote-logs as a lightweight check
$ok = $false
for ($i=0; $i -lt $MaxRetries; $i++) {
    try {
        $res = Invoke-RestMethod -Uri ($BaseUrl + '/api/quote-logs?limit=1') -Method Get -TimeoutSec 10
        if ($res -and $res.ok) { $ok = $true; break }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $ok) {
    Write-Host 'HTTP healthcheck failed' ; exit 2
}

# 2) Postgres check (if using Docker and container name nki-postgres)
try {
    docker exec -i nki-postgres psql -U postgres -d quotes -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host 'Postgres check failed'; exit 3 }
} catch {
    Write-Host 'Postgres check exception'; exit 3
}

Write-Host 'Healthcheck OK' ; exit 0
