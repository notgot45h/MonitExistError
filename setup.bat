@echo off
chcp 65001 >nul
title Discord Bot - Настройка
color 0E

setlocal EnableDelayedExpansion

echo.
echo ========================================
echo    Discord Bot - Настройка конфигурации
echo ========================================
echo.

echo.
echo Заполните настройки бота:
echo.

:INPUT_TOKEN
set /p DISCORD_TOKEN="Bot Token: "
if "!DISCORD_TOKEN!"=="" (
    echo Bot Token не может быть пустым!
    goto INPUT_TOKEN
)
 
:INPUT_CLIENT
set /p CLIENT_ID="Bot ID: "
if "!CLIENT_ID!"=="" (
    echo Bot ID не может быть пустым!
    goto INPUT_CLIENT
)

set "CLEANED_CLIENT="
:clean_client
if defined CLIENT_ID (
    set "char=!CLIENT_ID:~0,1!"
    set "CLIENT_ID=!CLIENT_ID:~1!"
    if "!char!"=="0" set "CLEANED_CLIENT=!CLEANED_CLIENT!0"
    if "!char!"=="1" set "CLEANED_CLIENT=!CLEANED_CLIENT!1"
    if "!char!"=="2" set "CLEANED_CLIENT=!CLEANED_CLIENT!2"
    if "!char!"=="3" set "CLEANED_CLIENT=!CLEANED_CLIENT!3"
    if "!char!"=="4" set "CLEANED_CLIENT=!CLEANED_CLIENT!4"
    if "!char!"=="5" set "CLEANED_CLIENT=!CLEANED_CLIENT!5"
    if "!char!"=="6" set "CLEANED_CLIENT=!CLEANED_CLIENT!6"
    if "!char!"=="7" set "CLEANED_CLIENT=!CLEANED_CLIENT!7"
    if "!char!"=="8" set "CLEANED_CLIENT=!CLEANED_CLIENT!8"
    if "!char!"=="9" set "CLEANED_CLIENT=!CLEANED_CLIENT!9"
    goto clean_client
)
set "CLIENT_ID=!CLEANED_CLIENT!"

if "!CLIENT_ID!"=="" (
    echo ОШИБКА: Не удалось извлечь цифры из Bot ID!
    goto INPUT_CLIENT
)

:INPUT_GUILD
set /p GUILD_ID="Server ID: "
if "!GUILD_ID!"=="" (
    echo Server ID не может быть пустым!
    goto INPUT_GUILD
)

set "CLEANED_GUILD="
:clean_guild
if defined GUILD_ID (
    set "char=!GUILD_ID:~0,1!"
    set "GUILD_ID=!GUILD_ID:~1!"
    if "!char!"=="0" set "CLEANED_GUILD=!CLEANED_GUILD!0"
    if "!char!"=="1" set "CLEANED_GUILD=!CLEANED_GUILD!1"
    if "!char!"=="2" set "CLEANED_GUILD=!CLEANED_GUILD!2"
    if "!char!"=="3" set "CLEANED_GUILD=!CLEANED_GUILD!3"
    if "!char!"=="4" set "CLEANED_GUILD=!CLEANED_GUILD!4"
    if "!char!"=="5" set "CLEANED_GUILD=!CLEANED_GUILD!5"
    if "!char!"=="6" set "CLEANED_GUILD=!CLEANED_GUILD!6"
    if "!char!"=="7" set "CLEANED_GUILD=!CLEANED_GUILD!7"
    if "!char!"=="8" set "CLEANED_GUILD=!CLEANED_GUILD!8"
    if "!char!"=="9" set "CLEANED_GUILD=!CLEANED_GUILD!9"
    goto clean_guild
)
set "GUILD_ID=!CLEANED_GUILD!"

if "!GUILD_ID!"=="" (
    echo ОШИБКА: Не удалось извлечь цифры из Server ID!
    goto INPUT_GUILD
)

echo DISCORD_TOKEN=!DISCORD_TOKEN! > .env
echo CLIENT_ID=!CLIENT_ID! >> .env
echo GUILD_ID=!GUILD_ID! >> .env

echo.
echo ========================================
echo    НАСТРОЙКА ЗАВЕРШЕНА!
echo ========================================
echo.
echo Файл .env успешно создан!
echo.
echo Bot Token: !DISCORD_TOKEN!
echo Bot ID: !CLIENT_ID!
echo Server ID: !GUILD_ID!
echo.
pause