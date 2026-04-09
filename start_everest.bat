@echo off
TITLE Everest O'quv Markazi - Server
cd /d "%~dp0"

echo Serverni tekshirilmoqda...
"C:\Program Files\nodejs\node.exe" -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Node.js topilmadi!
    exit /b
)

echo Server ishga tushirilmoqda...
:: Browserni ochish (optional, but requested in previous versions)
start "" "http://localhost:3000"

:: Serverni ishga tushirish (bu jarayon launcher tomonidan yashirilgan)
"C:\Program Files\nodejs\node.exe" server.js
