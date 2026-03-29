@echo off
title Stripe CLI - Trigger Test Event
color 0A

echo ============================================
echo   Stripe CLI - Declencher un Test
echo ============================================
echo.

REM Verifier que Stripe CLI est installe
where stripe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Stripe CLI n'est pas installe
    pause
    exit /b 1
)

echo Selectionnez un evenement a tester :
echo.
echo 1. payment_intent.succeeded (Paiement reussi)
echo 2. invoice.payment_succeeded (Abonnement paye)
echo 3. payment_intent.payment_failed (Paiement echoue)
echo 4. customer.subscription.deleted (Abonnement annule)
echo.
set /p choice="Votre choix (1-4): "

if "%choice%"=="1" (
    echo.
    echo Envoi de payment_intent.succeeded...
    stripe trigger payment_intent.succeeded
) else if "%choice%"=="2" (
    echo.
    echo Envoi de invoice.payment_succeeded...
    stripe trigger invoice.payment_succeeded
) else if "%choice%"=="3" (
    echo.
    echo Envoi de payment_intent.payment_failed...
    stripe trigger payment_intent.payment_failed
) else if "%choice%"=="4" (
    echo.
    echo Envoi de customer.subscription.deleted...
    stripe trigger customer.subscription.deleted
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
pause

