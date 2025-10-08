@echo off
chcp 65001 >nul
title Discord Bot
color 0A

echo.
echo Запуск Discord бота...
echo.

if not exist "node_modules" (
    echo Папка node_modules не найдена
    echo Запускаю установку зависимостей...
    call install.bat
)

node cli.js

pause