@echo off
TITLE Everest O'quv Markazi - Server
cd /d "%~dp0"

echo Serverni tekshirilmoqda...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Node.js topilmadi! Iltimos, Node.js o'rnatilganini tekshiring.
    pause
    exit /b
)

echo Server ishga tushirilmoqda...
:: Browserni ochish (agarda kerak bo'lsa buni o'chirib qo'yish mumkin)
start "" "http://localhost:3000"

:: Serverni ishga tushirish
node server.js
