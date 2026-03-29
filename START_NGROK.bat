@echo off
echo ===================================
echo   $forS - Partage avec ngrok
echo ===================================
echo.
echo 1. Assurez-vous que le serveur est demarre (npm start)
echo 2. Appuyez sur Entree pour lancer ngrok...
pause > nul

REM Chercher ngrok dans le PATH ou le dossier actuel
where ngrok >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Lancement de ngrok sur le port 4100...
    echo.
    echo Votre URL publique sera affichee ci-dessous
    echo.
    ngrok http 4100
) else (
    echo.
    echo [ERREUR] ngrok n'est pas installe ou n'est pas dans le PATH.
    echo.
    echo Veuillez :
    echo 1. Telecharger ngrok depuis https://ngrok.com/download
    echo 2. Decompresser ngrok.exe
    echo 3. Soit le placer dans ce dossier, soit l'ajouter au PATH system
    echo.
    pause
)

