@echo off
echo ========================================
  Shopee Growth Quest - Plataforma Central
echo ========================================
echo.

:: Start frontend
echo Starting frontend (React + Vite)...
cd /d "%~dp0frontend"
start "Frontend" cmd /c "npm run dev"

:: Start backend
echo Starting backend (FastAPI)...
cd /d "%~dp0backend"
start "Backend" cmd /c "uvicorn main:app --reload --port 8000"

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/docs
echo.
pause
