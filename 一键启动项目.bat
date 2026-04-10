@echo off
setlocal
title GradBot Launcher

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo ========================================
echo GradBot Launcher
echo Root: %ROOT_DIR%
echo ========================================
echo.

if not exist "%BACKEND_DIR%\package.json" (
  echo [ERROR] Backend folder not found: %BACKEND_DIR%
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend folder not found: %FRONTEND_DIR%
  pause
  exit /b 1
)

echo [1/5] Starting MySQL service...
net start MySQL80 >nul 2>nul
if errorlevel 1 (
  echo [WARN] Could not start MySQL80 automatically.
  echo Run this script as Administrator, or start MySQL80 manually first.
) else (
  echo [OK] MySQL80 is running.
)
echo.

echo [2/5] Checking backend dependencies...
if not exist "%BACKEND_DIR%\node_modules" (
  echo [ERROR] Backend dependencies are missing.
  echo Run:
  echo   cd /d "%BACKEND_DIR%"
  echo   npm install
  pause
  exit /b 1
)
echo [OK] Backend dependencies found.
echo.

echo [3/5] Checking frontend dependencies...
if not exist "%FRONTEND_DIR%\node_modules" (
  echo [ERROR] Frontend dependencies are missing.
  echo Run:
  echo   cd /d "%FRONTEND_DIR%"
  echo   npm install
  pause
  exit /b 1
)
echo [OK] Frontend dependencies found.
echo.

echo [4/5] Starting backend...
start "GradBot Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && npm start"
echo [OK] Backend window opened.
echo.

echo [5/5] Starting frontend...
start "GradBot Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"
echo [OK] Frontend window opened.
echo.

echo Done.
echo Frontend: http://localhost:5173
echo Backend health: http://localhost:3000/api/health
echo.
echo If this is the first start, wait a few seconds before opening the page.
pause
