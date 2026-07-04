@echo off
echo.
echo ============================================
echo   Enterprise HRMS - Starting Servers
echo ============================================
echo.

cd /d D:\ODOO\backend

IF NOT EXIST hrms.db (
  echo [SETUP] Database not found. Running first-time setup...
  node seed.js
)

echo [1/2] Starting API server on http://localhost:3000 ...
start "HRMS API" cmd /k "node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend on http://localhost:8080 ...
cd /d D:\ODOO\frontend
start "HRMS Frontend" cmd /k "python -m http.server 8080"

timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo   HRMS is running!
echo   Frontend : http://localhost:8080
echo   API      : http://localhost:3000
echo ============================================
echo.
start http://localhost:8080
