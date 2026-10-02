param([string]$Python = 'python')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path '.venv/Scripts/python.exe')) {
    & $Python -m venv .venv
    if ($LASTEXITCODE) { throw 'Python 3.12 is required. Pass -Python with its executable path.' }
}
& '.venv/Scripts/python.exe' -c 'import flask, flask_cors, sklearn, dotenv' 2>$null
if ($LASTEXITCODE) {
    & '.venv/Scripts/python.exe' -m pip install -r requirements-lock.txt
    if ($LASTEXITCODE) { throw 'Python dependency installation failed.' }
}
if (!(Test-Path 'logintel_ui/node_modules/vite/bin/vite.js')) {
    Push-Location logintel_ui
    try {
        npm ci
        if ($LASTEXITCODE) { throw 'Frontend installation failed.' }
    } finally { Pop-Location }
}
New-Item -ItemType Directory -Force data | Out-Null
$savedDemoMode = $env:NEUROLOG_DEMO
try {
    $env:NEUROLOG_DEMO = 'true'
    if (!(Get-NetTCPConnection -State Listen -LocalPort 5001 -ErrorAction SilentlyContinue)) {
        Start-Process -FilePath (Join-Path $PSScriptRoot '.venv/Scripts/python.exe') -ArgumentList 'LogIntel_engine/api.py' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'data/backend.stdout.log') -RedirectStandardError (Join-Path $PSScriptRoot 'data/backend.stderr.log') | Out-Null
    }
    if (!(Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue)) {
        $nodeExecutable = (Get-Command node).Source
        Start-Process -FilePath $nodeExecutable -ArgumentList 'node_modules/vite/bin/vite.js' -WorkingDirectory (Join-Path $PSScriptRoot 'logintel_ui') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'data/frontend.stdout.log') -RedirectStandardError (Join-Path $PSScriptRoot 'data/frontend.stderr.log') | Out-Null
    }
} finally { $env:NEUROLOG_DEMO = $savedDemoMode }
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:5173/api/health' -TimeoutSec 2
        if (!$health.demo) { throw 'Port 5001 is serving authenticated mode. Stop that backend and relaunch the demo.' }
        $logs = Invoke-RestMethod -Uri 'http://127.0.0.1:5173/api/recent-logs' -TimeoutSec 2
        if ($logs.Count -eq 0) { Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5173/api/demo/seed' | Out-Null }
        Write-Output 'Demo ready: http://127.0.0.1:5173/dashboard'
        Write-Output 'The preview runs in the background. Logs are in data/.'
        exit 0
    } catch {
        if ($attempt -eq 29) { throw 'Preview did not start. Inspect data/backend.stderr.log and data/frontend.stderr.log.' }
        Start-Sleep -Milliseconds 500
    }
}
