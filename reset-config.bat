@echo off
chcp 65001 >nul
title Discord Bot - Сброс настроек
color 0C

echo.
echo ========================================
echo    Discord Bot - Сброс конфигурации
echo ========================================
echo.

if exist ".env" (
    echo Удаляю текущий файл конфигурации...
    del .env
    echo Файл .env удален!
) else (
    echo Файл .env не найден.
)

echo.
echo Хотите создать новую конфигурацию?
choice /C YN /N /M "Создать новую конфигурацию (Y/N)? "

if %errorlevel% equ 1 (
    call setup.bat
) else (
    echo.
    echo Вы можете создать конфигурацию позже с помощью setup.bat
    echo.
    pause
)