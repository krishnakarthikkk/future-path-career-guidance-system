@echo off
title AI Career Recommendation and Student Profile Analyzer Launcher
echo ====================================================================
echo  AI Career Recommendation and Student Profile Analyzer Launcher
echo ====================================================================

:: Safely change to directory containing the script
cd /d "%~dp0"cmd /c "run.bat"

:: Step 1: Backend Setup & Launch
echo [1/3] Initializing Backend Server...
if not exist "backend\venv" (
    echo Creating Python Virtual Environment...
    python -m venv backend\venv
)

echo Installing/Verifying Backend dependencies...
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt

echo Launching Flask Backend on http://localhost:5000...
start "Backend - Flask REST API" cmd /k "call backend\venv\Scripts\activate.bat && python backend\app.py"

:: Step 2: Frontend Launch
echo [2/3] Initializing Frontend Server...
echo Launching React Dev Server on http://localhost:5173...
start "Frontend - React Vite" cmd /k "cd frontend && cmd.exe /c npm run dev"

:: Step 3: Open App
echo [3/3] Application servers booted!
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul
echo Opening your web browser to http://localhost:5173...
start http://localhost:5173

echo ====================================================================
echo Launcher is complete. 
echo To shut down, close the two opened terminal windows.
echo ====================================================================
pause