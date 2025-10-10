@echo off
chcp 65001 >nul
title Discord Bot - Deploy Global Commands
color 0A

echo.
echo Обновление ГЛОБАЛЬНЫХ слеш-команд...
echo Команды появятся на всех серверах в течении 24 часов!
echo.

if not exist "node_modules" (
    echo Папка node_modules не найдена
    echo Запускаю установку зависимостей...
    call install.bat
)

node deploy-commands-global.js

echo.
echo Глобальные команды отправлены на обновление!
echo Они появятся на всех серверах в течение 24 часов.
echo.
pause