@echo off
title Recherche de stripe.exe
color 0B

echo ============================================
echo   Recherche de stripe.exe
echo ============================================
echo.

REM Chercher dans le dossier actuel
if exist stripe.exe (
    echo [OK] stripe.exe trouve dans ce dossier !
    echo.
    echo Utilisez : .\stripe.exe
    pause
    exit /b 0
)

REM Chercher dans le PATH
where stripe >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [OK] stripe.exe trouve dans le PATH
    echo.
    echo Utilisez : stripe
    pause
    exit /b 0
)

echo [ERREUR] stripe.exe non trouve
echo.
echo Veuillez :
echo   1. Telecharger stripe.exe depuis :
echo      https://github.com/stripe/stripe-cli/releases/latest
echo.
echo   2. Decompresser le ZIP
echo.
echo   3. Copier stripe.exe dans ce dossier :
echo      %CD%
echo.
echo   4. Ou l'ajouter au PATH Windows
echo.
pause

