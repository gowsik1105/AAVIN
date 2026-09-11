Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Aavin Main Dairy Explorer on http://localhost:8080/" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Start-Process "http://localhost:8080/"
& "$PSScriptRoot\server.ps1"
