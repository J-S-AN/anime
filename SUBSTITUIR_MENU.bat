@echo off
chcp 65001 >nul
title Substituir Menu HTML
cd /d "%~dp0"

echo ==========================================
echo       SUBSTITUICAO DO MENU HTML
echo ==========================================
echo.
echo Pasta: %CD%
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SUBSTITUIR_MENU.ps1"

echo.
echo ==========================================
echo Processo finalizado.
echo ==========================================
pause