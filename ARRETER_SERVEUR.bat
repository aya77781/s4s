@echo off
title Arreter le serveur sur le port 4100
color 0C

echo ============================================
echo   Arret du serveur sur le port 4100
echo ============================================
echo.

echo Recherche du processus utilisant le port 4100...
echo.

REM Trouver le PID du processus utilisant le port 4100
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4100') do (
    set PID=%%a
    echo Processus trouve : PID %%a
    echo.
    echo Arret du processus...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! == 0 (
        echo [OK] Processus arrete avec succes
    ) else (
        echo [ERREUR] Impossible d'arreter le processus
    )
)

echo.
echo ============================================
echo   Serveur arrete
echo ============================================
echo.
echo Vous pouvez maintenant redemarrer avec: npm start
echo.
pause

