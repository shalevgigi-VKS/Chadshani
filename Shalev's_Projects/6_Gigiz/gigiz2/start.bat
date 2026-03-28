@echo off
title גיגיז — הפעלה
color 0A

set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.109

echo.
echo  ==========================================
echo   גיגיז — מפעיל שרתים מקומיים
echo  ==========================================
echo.
echo  [1/2] מפעיל Firebase Emulator...
start "Firebase Emulator" /min cmd /k "set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot && set PATH=%JAVA_HOME%\bin;%PATH% && cd /d %~dp0 && npx firebase-tools emulators:start --only auth,firestore,storage --project demo-gigiz --import ./emulator-data --export-on-exit ./emulator-data"

echo  ממתין 15 שניות לאמולטור...
timeout /t 15 /nobreak > nul

echo  [2/2] מפעיל Expo...
start "Expo Dev Server" cmd /k "set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.109 && cd /d %~dp0 && npx expo start --lan"

echo.
echo  ==========================================
echo   הכל עולה!
echo.
echo   באייפון:
echo   1. התקן Expo Go מה-App Store
echo   2. פתח Expo Go
echo   3. לחץ "Enter URL manually"
echo   4. הקלד: exp://192.168.1.109:8081
echo.
echo   PIN: 1234
echo  ==========================================
echo.
pause
