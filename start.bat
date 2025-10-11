@echo off
chcp 65001 >nul
title Discord Bot
color 0A

echo.
echo ========================================
echo    Discord Bot - Запуск
echo ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не найден в PATH!
    echo.
    echo Скачайте и установите Node.js с:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Папка node_modules не найдена
    echo Запускаю установку зависимостей...
    call install.bat
)

if not exist ".env" (
    echo Файл .env не найден!
    echo Запуск настройки...
    call setup.bat
    goto :CHECK_AFTER_SETUP
)

findstr /C:"DISCORD_TOKEN=your_bot_token_here" .env >nul
if %errorlevel% equ 0 (
    echo Настройки бота не заполнены!
    echo Запуск настройки...
    call setup.bat
    goto :CHECK_AFTER_SETUP
)

:CHECK_AFTER_SETUP
call :CHECK_ENV
if %ENV_VALID% neq 1 (
    echo.
    echo ОШИБКА: Не все настройки заполнены!
    echo Запустите setup.bat для настройки бота.
    pause
    exit /b 1
)

echo Все настройки проверены на частичное наличие. Запуск CLI Controller...
echo.
node cli.js
pause
exit /b 0

:CHECK_ENV
set ENV_VALID=0
if not exist ".env" (
    goto :EOF
)

findstr /C:"DISCORD_TOKEN=your_bot_token_here" .env >nul
if %errorlevel% equ 0 goto :EOF

set ENV_VALID=1
goto :EOF