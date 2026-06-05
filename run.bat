@echo off
setlocal

REM Always run from this script's directory
cd /d "%~dp0"

call :FreePort 3000
call :FreePort 24678

if not exist ".env.local" (
  if exist ".env.example" (
    copy /y ".env.example" ".env.local" >nul
    echo Created .env.local from .env.example.
    echo Edit .env.local and set GEMINI_API_KEY or VITE_GEMINI_API_KEY to your Gemini API key.
  ) else (
    echo .env.example was not found.
    pause
    exit /b 1
  )
)

REM Prefer system Node.js, but fall back to local portable Node in .tools
where node >nul 2>&1
if errorlevel 1 (
  if exist ".tools\node-v24.14.0-win-x64\node.exe" (
    set "PATH=%cd%\.tools\node-v24.14.0-win-x64;%PATH%"
    echo Using local Node.js from .tools\node-v24.14.0-win-x64
  ) else (
    echo Node.js was not found in PATH.
    echo Install Node.js LTS or extract a portable Node.js runtime to:
    echo   .tools\node-v24.14.0-win-x64
    pause
    exit /b 1
  )
)

echo [1/2] Installing dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo Failed to install dependencies.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting development server...
call npm run dev
if errorlevel 1 (
  echo.
  echo Failed to start development server.
  pause
  exit /b 1
)

endlocal

goto :eof

:FreePort
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%~1 .*LISTENING"') do (
  taskkill /F /PID %%P >nul 2>&1
)
goto :eof
