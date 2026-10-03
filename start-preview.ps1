param([string]$Python = 'python', [switch]$Restart)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path '.venv/Scripts/python.exe')) {
    & $Python -m venv .venv
    & '.venv/Scripts/python.exe' -m pip install -r requirements-lock.txt
    if ($LASTEXITCODE) { throw 'Python dependency installation failed.' }
}
if (!(Test-Path 'logintel_ui/node_modules/vite/bin/vite.js')) {
    Push-Location logintel_ui
    try { npm ci; if ($LASTEXITCODE) { throw 'Frontend installation failed.' } }
    finally { Pop-Location }
}
New-Item -ItemType Directory -Force data | Out-Null
$services = @(
    @{ Name='backend'; Port=5001; File=(Join-Path $PSScriptRoot '.venv/Scripts/python.exe'); Args='LogIntel_engine/api.py'; Directory=$PSScriptRoot },
    @{ Name='tasks'; Port=8000; File=(Join-Path $PSScriptRoot '.venv/Scripts/python.exe'); Args='-m live_app.app'; Directory=$PSScriptRoot },
    @{ Name='frontend'; Port=5173; File=(Get-Command node).Source; Args='node_modules/vite/bin/vite.js'; Directory=(Join-Path $PSScriptRoot 'logintel_ui') }
)
$savedMode = $env:NEUROLOG_LOCAL_MODE
try {
    $env:NEUROLOG_LOCAL_MODE = 'true'
    foreach ($service in $services) {
        $pidFile = Join-Path $PSScriptRoot "data/$($service.Name).pid"
        if ($Restart -and (Test-Path $pidFile)) {
            $managedId = [int](Get-Content $pidFile)
            $managed = Get-CimInstance Win32_Process -Filter "ProcessId=$managedId"
            if ($managed -and $managed.CommandLine.Contains($service.Args)) { Stop-Process -Id $managedId -Force }
        }
        if (!(Get-NetTCPConnection -State Listen -LocalPort $service.Port -ErrorAction SilentlyContinue)) {
            $process = Start-Process -FilePath $service.File -ArgumentList $service.Args -WorkingDirectory $service.Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot "data/$($service.Name).stdout.log") -RedirectStandardError (Join-Path $PSScriptRoot "data/$($service.Name).stderr.log")
            Set-Content $pidFile $process.Id
        }
    }
} finally { $env:NEUROLOG_LOCAL_MODE = $savedMode }
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $health = Invoke-RestMethod 'http://127.0.0.1:5173/api/health' -TimeoutSec 2
        if (!$health.local_mode) { throw 'Backend is outdated or local mode is disabled.' }
        $tasks = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 2
        if ($tasks.service -ne 'task-service') { throw 'Port 8000 belongs to another service.' }
        Write-Output 'NeuroLog: http://127.0.0.1:5173/dashboard'
        Write-Output 'Python application: http://127.0.0.1:8000'
        Write-Output 'Services run in the background. Runtime logs are in data/.'
        exit 0
    } catch {
        if ($attempt -eq 29) { throw "Startup failed: $($_.Exception.Message) Inspect data/*.stderr.log." }
        Start-Sleep -Milliseconds 500
    }
}
