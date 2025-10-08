@echo off
chcp 65001 >nul
title Discord Bot - Update Dependencies
color 0B

echo.
echo Обновление зависимостей npm...
echo.

npm update

echo.
echo Зависимости обновлены!
echo.
pause