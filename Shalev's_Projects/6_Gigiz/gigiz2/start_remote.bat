@echo off
title גיגיז — מצב מרוחק (bore.pub tunnel)
color 0B

echo.
echo  ==========================================
echo   גיגיז — מצב אופליין + מנהרה מרוחקת
echo  ==========================================
echo.

echo  [1/2] מפעיל bore tunnel (bore.pub:8081)...
start "Bore Tunnel" /min cmd /k "%~dp0bore.exe local 8081 --to bore.pub --port 8081"

echo  ממתין 5 שניות למנהרה...
timeout /t 5 /nobreak > nul

echo  [2/2] מפעיל Expo (offline mode)...
start "Expo Dev Server" cmd /k "set EXPO_PUBLIC_OFFLINE_MODE=true && set EXPO_PUBLIC_APP_PIN=1234 && set REACT_NATIVE_PACKAGER_HOSTNAME=bore.pub && cd /d %~dp0 && npx expo start --port 8081 --lan"

echo.
echo  ==========================================
echo   הכל עולה!
echo.
echo   באייפון (מכל מקום בעולם):
echo   1. התקן Expo Go מה-App Store
echo   2. פתח Expo Go
echo   3. לחץ "Enter URL manually"
echo   4. הקלד: exp://bore.pub:8081
echo.
echo   PIN: 1234
echo.
echo   מצב: OFFLINE — כל הנתונים שמורים מקומית
echo  ==========================================
echo.
pause
