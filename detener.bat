@echo off
chcp 65001 > nul
title Detener Servidor Odontologia
cd /d "%~dp0"

echo ========================================================
echo   DETENIENDO SERVIDOR ODONTOLOGICO (PUERTO 3000)
echo ========================================================
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Terminando proceso en puerto 3000 (PID: %%a)...
    taskkill /f /pid %%a > nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo.
    echo [OK] El servidor ha sido detenido y el puerto 3000 ha quedado libre.
) else (
    echo.
    echo [INFO] No habia ningun servidor activo en el puerto 3000.
)

echo.
echo Presiona cualquier tecla para salir...
pause > nul
