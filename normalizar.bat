@echo off
title Normalizar audios de Mental
chcp 65001 >nul

echo ============================================
echo  Normalizar audios de Mental
echo  Carpeta: %~dp0
echo ============================================
echo.
echo Revisando archivos... puede tardar unos segundos.
echo Los ya normalizados se saltan solos.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0normalizar.ps1"
set CODIGO=%ERRORLEVEL%

echo.
echo --------------------------------------------
echo Proceso terminado (codigo %CODIGO%).
echo --------------------------------------------
pause
