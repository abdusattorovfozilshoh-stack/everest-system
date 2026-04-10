@echo off
TITLE Everest O'quv Markazi - Server
cd /d "%~dp0"

echo [1/3] Serverni tekshirilmoqda...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Node.js topilmadi! Iltimos, Node.js o'rnatilganini tekshiring.
    pause
    exit /b
)

echo [2/3] Server ishga tushirilmoqda...
:: Serverni fonda ishga tushirish va loglarni terminalda ko'rsatish
:: npm start ishlatish o'rniga to'g'ridan-to'g'ri node server.js chaqiramiz
start /b node server.js

:: Server ishga tushishi uchun biroz kutamiz
timeout /t 2 /nobreak >nul

echo [3/3] Brauzerni ochish...
start "" "http://localhost:3000"

echo ===================================================
echo SERVER ISHGA TUSHDI! 
echo O'chirish uchun ushbu oynani yopmang (yoki Ctrl+C bosing).
echo Xatoliklar error.log fayliga yozib boriladi.
echo ===================================================
pause
