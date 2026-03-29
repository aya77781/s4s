@echo off
cls
echo ============================================
echo   $forS - Partage avec ngrok
echo ============================================
echo.
echo IMPORTANT: Assurez-vous que le serveur tourne d'abord !
echo.
echo Si le serveur n'est pas demarre, faites ceci:
echo   1. Ouvrez un autre terminal
echo   2. Tapez: npm start
echo   3. Attendez que vous voyiez: "Serveur S4S en cours d'execution"
echo.
echo ============================================
echo.
pause
echo.
echo Lancement de ngrok sur le port 4100...
echo.
echo Votre URL publique va s'afficher ci-dessous !
echo.
echo ============================================
echo.

ngrok http 4100

echo.
echo ============================================
echo   ngrok arrete
echo ============================================
pause

