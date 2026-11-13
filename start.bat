@echo off
rem Double-click to open the apartments site in your browser.
rem Keep this window open while you use the site; close it to stop.
cd /d "%~dp0"
if not exist node_modules (
  echo Installing packages the first time...
  call npm install
)
call npm run dev -- --open
pause
