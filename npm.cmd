@echo off
echo ========================================================
echo   Node/NPM is not required for this zero-dependency app!
echo   Launching Aavin Main Dairy Explorer at http://localhost:8080/
echo ========================================================
start http://localhost:8080/
powershell -ExecutionPolicy Bypass -File .\server.ps1
