@echo off
chcp 65001 > nul
title Servidor Odontologia - En ejecucion
cd /d "%~dp0"

echo ========================================================
echo   INICIANDO SISTEMA DE GESTION ODONTOLOGICA
echo ========================================================
echo.
echo [1/2] Abriendo navegador en http://localhost:3000...
start http://localhost:3000

echo [2/2] Iniciando servidor Next.js...
echo Para detenerlo, cierra esta ventana o ejecuta detener.bat
echo ========================================================
echo.

call npm.cmd run dev
pause
