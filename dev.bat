@echo off
echo ========================================================
echo   Starting Aavin Main Dairy Explorer (Local Dev)...
echo ========================================================
start http://localhost:8080/
powershell -ExecutionPolicy Bypass -File .\server.ps1
pause
