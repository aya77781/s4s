@echo off
title Stripe CLI - Test Webhook Local
color 0B

echo ============================================
echo   Stripe CLI - Test Webhook Local
echo ============================================
echo.

REM Verifier que Stripe CLI est installe
where stripe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Stripe CLI n'est pas installe
    echo.
    echo Installez Stripe CLI :
    echo   1. Ouvrez PowerShell en administrateur
    echo   2. Tapez : winget install stripe.stripe-cli
    echo.
    echo Ou telechargez depuis :
    echo   https://github.com/stripe/stripe-cli/releases/latest
    echo.
    pause
    exit /b 1
)

echo [OK] Stripe CLI est installe
stripe --version
echo.

echo ============================================
echo   Instructions
echo ============================================
echo.
echo 1. Assurez-vous que le serveur tourne (npm start)
echo 2. Cette commande va forwarder les webhooks vers :
echo    http://localhost:4100/api/payments/webhook
echo.
echo IMPORTANT : Un nouveau secret webhook sera affiche
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

stripe listen --forward-to http://localhost:4100/api/payments/webhook

pause

