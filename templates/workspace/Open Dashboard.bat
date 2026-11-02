@echo off
REM Double-click to open your job dashboard in the browser.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install the LTS version, then run this again. & start https://nodejs.org/en/download & pause & exit /b 1)
start "Job dashboard" /min node app\scripts\dashboard.mjs --dir .
timeout /t 1 >nul
start http://localhost:4747
