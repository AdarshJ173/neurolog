param([string]$Python = 'python')
& (Join-Path $PSScriptRoot 'start-preview.ps1') -Python $Python
