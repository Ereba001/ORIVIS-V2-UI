@echo off
cd /d "%~dp0"
echo Stopping any existing node processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting Vite dev server on port 3001...
npx --yes vite --port=3001 --host=0.0.0.0
pause
