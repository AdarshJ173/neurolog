param([string]$Python = 'python')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path '.venv/Scripts/python.exe')) {
    & $Python -m venv .venv
    if ($LASTEXITCODE) { throw 'Install Python 3.12 or pass -Python with its executable path.' }
}
& '.venv/Scripts/python.exe' -m pip install -r requirements.txt
if ($LASTEXITCODE) { throw 'Python dependency installation failed.' }
Push-Location logintel_ui
try {
    npm ci
    if ($LASTEXITCODE) { throw 'Frontend dependency installation failed.' }
} finally { Pop-Location }
$backend = Start-Process -FilePath (Join-Path $PSScriptRoot '.venv/Scripts/python.exe') -ArgumentList 'LogIntel_engine/api.py' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
try {
    Push-Location logintel_ui
    npm run dev
} finally {
    Pop-Location
    if (!$backend.HasExited) { Stop-Process -Id $backend.Id }
}
