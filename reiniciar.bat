@echo off
chcp 65001 > nul
title Reiniciar Servidor Odontologia
cd /d "%~dp0"

echo ========================================================
echo   REINICIANDO SERVIDOR ODONTOLOGICO
echo ========================================================
echo.
echo Deteniendo procesos previos en puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a > nul 2>&1
)
timeout /t 2 /nobreak > nul

echo Iniciando de nuevo...
start "" "%~dp0iniciar.bat"
exit
