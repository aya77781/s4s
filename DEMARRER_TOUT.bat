@echo off
title $forS - Demarrage Serveur + ngrok
color 0A

echo ============================================
echo   $forS - Demarrage Complet
echo ============================================
echo.
echo Ce script va demarrer:
echo   1. Le serveur Node.js (port 4100)
echo   2. ngrok (tunnel public)
echo.
echo ============================================
echo.

REM Verifier que Node.js est installe
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe ou pas dans le PATH
    echo Installez Node.js depuis: https://nodejs.org
    pause
    exit /b 1
)

REM Verifier que ngrok est installe
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] ngrok n'est pas installe ou pas dans le PATH
    echo Installez ngrok depuis: https://ngrok.com/download
    pause
    exit /b 1
)

echo Verification OK !
echo.
echo Demarrage du serveur dans 3 secondes...
timeout /t 3 >nul

REM Demarrer le serveur en arriere-plan
start "Serveur $forS" cmd /k "echo Serveur $forS - Port 4100 && npm start"

echo.
echo Serveur en cours de demarrage...
timeout /t 5 >nul

echo.
echo Demarrage de ngrok...
echo.
echo ============================================
echo   VOTRE URL PUBLIQUE VA S'AFFICHER CI-DESSOUS
echo ============================================
echo.

REM Lancer ngrok dans ce terminal (affichage)
ngrok http 4100

echo.
echo ============================================
echo   Arret en cours...
echo ============================================
pause

