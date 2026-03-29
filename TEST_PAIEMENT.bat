@echo off
title Stripe CLI - Tester un Paiement
color 0A

echo ============================================
echo   Stripe CLI - Declencher un Test
echo ============================================
echo.

REM Verifier que Stripe CLI est installe
where stripe.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] stripe.exe non trouve
    pause
    exit /b 1
)

echo Selectionnez un evenement a tester :
echo.
echo 1. payment_intent.succeeded (Paiement reussi)
echo 2. invoice.payment_succeeded (Abonnement paye)
echo.
set /p choice="Votre choix (1-2): "

if "%choice%"=="1" (
    echo.
    echo Envoi de payment_intent.succeeded...
    .\stripe.exe trigger payment_intent.succeeded
) else if "%choice%"=="2" (
    echo.
    echo Envoi de invoice.payment_succeeded...
    .\stripe.exe trigger invoice.payment_succeeded
) else (
    echo Choix invalide
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Test envoye !
echo ============================================
echo.
echo Verifiez les logs du serveur pour voir si
echo la transaction a ete enregistree.
echo.
echo Verifiez aussi :
echo   backend\data\transactions.json
echo   backend\data\contributions.json
echo.
pause

