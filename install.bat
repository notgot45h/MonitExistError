@echo off
chcp 65001 >nul
title Discord Bot Installer
color 0A

echo.
echo ========================================
echo    Discord Bot - Установка зависимостей
echo ========================================
echo.

echo [1/4] Проверка Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js не найден в PATH!
    echo.
    echo Скачайте и установите Node.js с:
    echo https://nodejs.org/
    echo.
    echo После установки перезапустите терминал.
    pause
    exit /b 1
)
echo Node.js обнаружен

echo [2/4] Проверка npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo npm не найден!
    echo Попробуйте переустановить Node.js
    pause
    exit /b 1
)
echo npm обнаружен

echo [3/4] Очистка кэша npm...
call npm cache clean --force >nul 2>&1
echo Кэш очищен

echo [4/4] Установка зависимостей...
echo Это может занять несколько минут...
timeout /t 2 /nobreak >nul

call npm install --registry https://registry.npmjs.org/ --no-fund --no-audit

if %errorlevel% neq 0 (
    echo.
    echo Ошибка установки зависимостей!
    echo.
    echo Попробуйте:
    echo 1. Проверить подключение к интернету
    echo 2. Запустить от имени администратора
    echo 3. Отключить антивирус на время установки
    echo.
    pause
    exit /b 1
)

if not exist ".env" (
    echo.
    echo Создаю файл .env...
    (
        echo DISCORD_TOKEN=your_bot_token_here
        echo CLIENT_ID=your_client_id_here
        echo GUILD_ID=your_guild_id_here
    ) > .env
    echo Файл .env создан
) else (
    echo Файл .env уже существует
)

echo.
echo ========================================
echo            УСТАНОВКА ЗАВЕРШЕНА!
echo ========================================
echo.
echo Все зависимости установлены!
echo.
echo Следующие шаги:
echo 1. Откройте файл .env в блокноте
echo 2. Замените your_bot_token_here на токен бота из Bot (Build-A-Bot)
echo 3. Замените your_client_id_here на ID бота из OAuth2
echo 4. Замените your_guild_id_here на ID вашей Гильдии
echo 5. Запустите start.bat
echo.
pause