@echo off
cls
echo ============================================
echo   TEST : Verification ngrok
echo ============================================
echo.

REM Verifier ngrok
where ngrok >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [OK] ngrok est installe
    ngrok version
) else (
    echo [ERREUR] ngrok n'est pas installe
    echo Telechargez depuis: https://ngrok.com/download
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Verification du token
echo ============================================
echo.
ngrok config check

echo.
echo ============================================
echo   Instructions
echo ============================================
echo.
echo Pour partager votre site:
echo   1. Double-cliquez sur START_SERVER.bat
echo   2. Attendez que le serveur demarre
echo   3. Double-cliquez sur DEMARRER_NGROK.bat
echo.
echo Ou double-cliquez sur DEMARRER_TOUT.bat
echo   (demarre les deux automatiquement)
echo.
pause

