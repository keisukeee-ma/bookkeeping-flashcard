@echo off
start "Backend" %~dp0start_backend.bat
ping -n 6 127.0.0.1 >nul
start "Frontend" %~dp0start_frontend.bat
ping -n 6 127.0.0.1 >nul
explorer "http://localhost:5173"
pause
