const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class LocaleBackupManager {
    constructor(localesDir) {
        this.localesDir = localesDir;
    }

    createDefaultLocales() {
        try {
            const defaultLocales = {
                'en': {
                    "language_info": {
                        "display_name": "English",
                        "native_name": "English (Written Automatically by AI)"
                    },
                    "bot_manager": {
                        "title": "Discord Bot Manager",
                        "status": "System Status",
                        "bot": "Bot",
                        "dependencies": "Dependencies",
                        "configuration": "Configuration",
                        "nodejs": "Node.js",
                        "running": "Running",
                        "stopped": "Stopped",
                        "installed": "Installed",
                        "missing": "Missing",
                        "configured": "Configured",
                        "not_configured": "Not Configured",
                        "not_installed": "Not Installed",
                        "enabled": "Enabled",
                        "disabled": "Disabled",
                        "found_version": "Found version: {0}",
                        "current_status": "Current system status:",
                        "select_action": "Select action:",
                        "press_enter": "Press Enter to continue...",
                        "shutting_down": "Shutting down...",
                        "plugins_directory": "Plugins directory",
                        "log_statistics": "Log statistics",
                        "log_file": "Log file",
                        "log_size": "Log size",
                        "log_entries": "Log entries",
                        "version": "Version",
                        "author": "Author"
                    },
                    "menu": {
                        "start_bot": "Start bot",
                        "stop_bot": "Stop bot",
                        "setup_bot": "Configure bot",
                        "install_deps": "Install dependencies",
                        "update_deps": "Update dependencies",
                        "reset_config": "Reset configuration",
                        "system_status": "System status",
                        "change_language": "Change language",
                        "exit": "Exit",
                        "manage_plugins": "Manage plugins",
                        "plugins": "Plugins"
                    },
                    "messages": {
                        "bot_started": "Bot started successfully! (PID: {0})",
                        "bot_stopped": "Bot stopped!",
                        "bot_already_running": "Bot is already running!",
                        "bot_not_running": "Bot is not running!",
                        "deps_installed": "Dependencies installed successfully!",
                        "deps_not_installed": "Dependencies not installed. Installing...",
                        "config_saved": "Configuration saved!",
                        "config_reset": "Configuration reset!",
                        "env_template_created": ".env template created. Please configure it manually!",
                        "env_not_configured": "Bot is not configured! Please edit .env file manually.",
                        "env_not_found": ".env file not found. Creating template...",
                        "use_stop_bot": "Use 'Stop bot' to stop the bot",
                        "stopping_bot_before_exit": "Stopping bot before exit...",
                        "no_plugins": "No plugins found"
                    },
                    "errors": {
                        "failed_to_start": "Failed to start bot: {0}",
                        "failed_to_stop": "Failed to stop bot: {0}",
                        "failed_to_install": "Failed to install dependencies!",
                        "failed_to_update": "Failed to update dependencies!",
                        "nodejs_not_installed": "Node.js is not installed!",
                        "npm_not_found": "npm not found!"
                    },
                    "prompts": {
                        "enter_token": "Enter Discord Bot Token:",
                        "token_empty": "Token cannot be empty!",
                        "enter_client_id": "Enter Bot Client ID:",
                        "enter_guild_id": "Enter Server ID:",
                        "client_id_invalid": "Client ID must contain numbers!",
                        "guild_id_invalid": "Server ID must contain numbers!",
                        "create_new_config": "Create new configuration?",
                        "continue": "Press Enter...",
                        "select_language": "Select language:",
                        "create_env_template": "Creating .env template file...",
                        "edit_env_instructions": "Please edit .env file with your credentials."
                    },
                    "help": {
                        "title": "Discord Bot Manager - Command Help:",
                        "main_commands": "Main commands:",
                        "auto_commands": "Automatic commands:",
                        "examples": "Examples:"
                    }
                },
                'ru': {
                    "language_info": {
                        "display_name": "Russian",
                        "native_name": "Русский"
                    },
                    "bot_manager": {
                        "title": "Менеджер Discord бота",
                        "status": "Статус системы",
                        "bot": "Бот",
                        "dependencies": "Зависимости",
                        "configuration": "Конфигурация",
                        "nodejs": "Node.js",
                        "running": "Запущен",
                        "stopped": "Остановлен",
                        "installed": "Установлены",
                        "missing": "Отсутствуют",
                        "configured": "Настроено",
                        "not_configured": "Не настроено",
                        "not_installed": "Не установлен",
                        "enabled": "Включен",
                        "disabled": "Отключен",
                        "found_version": "Найден версии: {0}",
                        "current_status": "Текущий статус системы:",
                        "select_action": "Выберите действие:",
                        "press_enter": "Нажмите Enter для продолжения...",
                        "shutting_down": "Завершение работы...",
                        "plugins_directory": "Директория плагинов",
                        "log_statistics": "Статистика логов",
                        "log_file": "Файл логов",
                        "log_size": "Размер логов",
                        "log_entries": "Записей в логах",
                        "version": "Версия",
                        "author": "Автор"
                    },
                    "menu": {
                        "start_bot": "Запустить бота",
                        "stop_bot": "Остановить бота",
                        "setup_bot": "Настроить бота",
                        "install_deps": "Установить зависимости",
                        "update_deps": "Обновить зависимости",
                        "reset_config": "Сброс настроек",
                        "system_status": "Статус системы",
                        "change_language": "Сменить язык",
                        "exit": "Выход",
                        "manage_plugins": "Управление плагинами",
                        "plugins": "Плагины"
                    },
                    "messages": {
                        "bot_started": "Бот успешно запущен! (PID: {0})",
                        "bot_stopped": "Бот остановлен!",
                        "bot_already_running": "Бот уже запущен!",
                        "bot_not_running": "Бот не запущен!",
                        "deps_installed": "Зависимости успешно установлены!",
                        "deps_not_installed": "Зависимости не установлены. Устанавливаем...",
                        "config_saved": "Настройки сохранены!",
                        "config_reset": "Конфигурация сброшена!",
                        "env_template_created": "Создан шаблон .env. Настройте его вручную!",
                        "env_not_configured": "Бот не настроен! Отредактируйте файл .env вручную.",
                        "env_not_found": "Файл .env не найден. Создаем шаблон...",
                        "use_stop_bot": "Используйте 'Остановить бота' для остановки бота",
                        "stopping_bot_before_exit": "Останавливаем бота перед выходом...",
                        "no_plugins": "Плагины не найдены"
                    },
                    "errors": {
                        "failed_to_start": "Ошибка запуска бота: {0}",
                        "failed_to_stop": "Ошибка остановки бота: {0}",
                        "failed_to_install": "Ошибка установки зависимостей!",
                        "failed_to_update": "Ошибка обновления зависимостей!",
                        "nodejs_not_installed": "Node.js не установлен!",
                        "npm_not_found": "npm не найден!"
                    },
                    "prompts": {
                        "enter_token": "Введите Discord Token бота:",
                        "token_empty": "Token не может быть пустым!",
                        "enter_client_id": "Введите Client ID бота:",
                        "enter_guild_id": "Введите Server ID:",
                        "client_id_invalid": "Client ID должен содержать цифры!",
                        "guild_id_invalid": "Server ID должен содержать цифры!",
                        "create_new_config": "Создать новую конфигурацию?",
                        "continue": "Нажмите Enter...",
                        "select_language": "Выберите язык:",
                        "create_env_template": "Создаем шаблон .env файла...",
                        "edit_env_instructions": "Пожалуйста, отредактируйте файл .env с вашими данными."
                    },
                    "help": {
                        "title": "Discord Bot Manager - Справка по командам:",
                        "main_commands": "Основные команды:",
                        "auto_commands": "Автоматические команды:",
                        "examples": "Примеры:"
                    }
                }
            };

            for (const [langCode, localeData] of Object.entries(defaultLocales)) {
                const localeFile = path.join(this.localesDir, `${langCode}.json`);
                fs.writeFileSync(localeFile, JSON.stringify(localeData, null, 2));
                console.log(chalk.green(`Created locale file: ${langCode}.json`));
            }
            
            return true;
        } catch (error) {
            console.log(chalk.red('Error creating default locales:'), error.message);
            return false;
        }
    }

}

module.exports = LocaleBackupManager;