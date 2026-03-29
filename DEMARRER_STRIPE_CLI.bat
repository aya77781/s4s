@echo off
title Stripe CLI - Forward Webhooks Locaux
color 0B

echo ============================================
echo   Stripe CLI - Forward Webhooks
echo ============================================
echo.

REM Verifier que Stripe CLI est installe
where stripe.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] stripe.exe non trouve dans ce dossier
    echo.
    echo Veuillez :
    echo   1. Telecharger stripe.exe depuis GitHub
    echo   2. Le placer dans ce dossier
    echo   3. Relancer ce script
    echo.
    pause
    exit /b 1
)

echo [OK] stripe.exe trouve
echo.

echo ============================================
echo   Instructions
echo ============================================
echo.
echo 1. Assurez-vous que le serveur tourne (npm start)
echo 2. Cette commande va forwarder les webhooks vers :
echo    http://localhost:4100/api/payments/webhook
echo.
echo IMPORTANT : Un secret webhook sera affiche
echo Copiez-le et ajoutez-le dans votre .env !
echo.
echo ============================================
echo.
pause

echo.
echo Demarrage de Stripe Listen...
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

.\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook

pause

