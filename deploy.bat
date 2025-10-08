@echo off
chcp 65001 >nul
title Discord Bot - Deploy Commands
color 0E

echo.
echo Обновление слеш-команд Discord...
echo.

if not exist "node_modules" (
    echo Папка node_modules не найдена
    echo Запускаю установку зависимостей...
    call install.bat
)

node deploy-commands.js

echo.
echo Команды обновлены!
echo.
pause