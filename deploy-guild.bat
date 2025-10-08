@echo off
chcp 65001 >nul
title Discord Bot - Deploy Guild Commands
color 0E

echo.
echo Обновление слеш-команд для гильдии...
echo Команды появятся мгновенно!
echo.

if not exist "node_modules" (
    echo Папка node_modules не найдена
    echo Запускаю установку зависимостей...
    call install.bat
)

node deploy-commands-guild.js

echo.
echo Команды для гильдии обновлены!
echo.
pause