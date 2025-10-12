@echo off
chcp 65001 >nul
title Discord Bot - Smart Launcher
color 0A

if exist "node_modules" (
    echo Зависимости уже установлены
    echo.
) else (
    echo Папка node_modules не найдена
    echo Установка зависимостей npm...
    echo Это может занять несколько минут...
    
    npm install
    
    if %errorlevel% neq 0 (
        echo.
        echo Ошибка установки зависимостей!
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo Зависимости успешно установлены!
    echo.
)

if not exist "package.json" (
    echo Ошибка: package.json не найден!
    echo Запустите в папке с ботом.
    echo.
    pause
    exit /b 1
)

echo Запуск бота...
echo.

call npm start

echo.
echo Бот завершил работу.
pause