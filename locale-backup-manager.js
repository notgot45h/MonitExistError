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
                        "found_version": "Found version: {0}",
                        "current_status": "Current system status:",
                        "select_action": "Select action:",
                        "press_enter": "Press Enter to continue...",
                        "shutting_down": "Shutting down..."
                    },
                    "menu": {
                        "start_bot": "Start bot",
                        "stop_bot": "Stop bot",
                        "install_deps": "Install dependencies",
                        "update_deps": "Update dependencies",
                        "deploy_guild": "Deploy commands (guild)",
                        "deploy_global": "Deploy commands (global)",
                        "system_status": "System status",
                        "change_language": "Change language",
                        "exit": "Exit"
                    },
                    "messages": {
                        "bot_started": "Bot started successfully! (PID: {0})",
                        "bot_stopped": "Bot stopped!",
                        "bot_already_running": "Bot is already running!",
                        "bot_not_running": "Bot is not running!",
                        "deps_installed": "Dependencies installed successfully!",
                        "config_saved": "Configuration saved!",
                        "config_reset": "Configuration reset!",
                        "commands_deployed": "Commands deployed successfully!",
                        "env_template_created": ".env template created. Please configure it manually!",
                        "env_not_configured": "Bot is not configured! Please edit .env file manually.",
                        "env_instructions": "\nTo configure the bot:\n1. Edit the .env file with your credentials\n2. Restart the bot"
                    },
                    "errors": {
                        "failed_to_start": "Failed to start bot: {0}",
                        "failed_to_stop": "Failed to stop bot: {0}",
                        "failed_to_install": "Failed to install dependencies!",
                        "failed_to_update": "Failed to update dependencies!",
                        "failed_to_deploy": "Failed to deploy commands: {0}"
                    },
                    "prompts": {
                        "continue": "Press Enter...",
                        "select_language": "Select language:"
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
                        "found_version": "Найден версии: {0}",
                        "current_status": "Текущий статус системы:",
                        "select_action": "Выберите действие:",
                        "press_enter": "Нажмите Enter для продолжения...",
                        "shutting_down": "Завершение работы..."
                    },
                    "menu": {
                        "start_bot": "Запустить бота",
                        "stop_bot": "Остановить бота",
                        "install_deps": "Установить зависимости",
                        "update_deps": "Обновить зависимости",
                        "deploy_guild": "Деплой команд (гильдия)",
                        "deploy_global": "Деплой команд (глобально)",
                        "system_status": "Статус системы",
                        "change_language": "Сменить язык",
                        "exit": "Выход"
                    },
                    "messages": {
                        "bot_started": "Бот успешно запущен! (PID: {0})",
                        "bot_stopped": "Бот остановлен!",
                        "bot_already_running": "Бот уже запущен!",
                        "bot_not_running": "Бот не запущен!",
                        "deps_installed": "Зависимости успешно установлены!",
                        "config_saved": "Настройки сохранены!",
                        "config_reset": "Конфигурация сброшена!",
                        "commands_deployed": "Команды успешно отправлены!",
                        "env_template_created": "Создан шаблон .env. Настройте его вручную!",
                        "env_not_configured": "Бот не настроен! Отредактируйте файл .env вручную.",
                        "env_instructions": "\nЧтобы настроить бота:\n1. Отредактируйте файл .env с вашими данными\n2. Перезапустите бота"
                    },
                    "errors": {
                        "failed_to_start": "Ошибка запуска бота: {0}",
                        "failed_to_stop": "Ошибка остановки бота: {0}",
                        "failed_to_install": "Ошибка установки зависимостей!",
                        "failed_to_update": "Ошибка обновления зависимостей!",
                        "failed_to_deploy": "Ошибка деплоя команд: {0}"
                    },
                    "prompts": {
                        "continue": "Нажмите Enter...",
                        "select_language": "Выберите язык:"
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

    backupLocale(languageCode, backupDir = 'locales_backup') {
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const localeFile = path.join(this.localesDir, `${languageCode}.json`);
            const backupFile = path.join(backupDir, `${languageCode}_${Date.now()}.json`);

            if (fs.existsSync(localeFile)) {
                fs.copyFileSync(localeFile, backupFile);
                console.log(chalk.green(`Backup created: ${backupFile}`));
                return backupFile;
            } else {
                console.log(chalk.yellow(`Locale file not found for backup: ${languageCode}`));
                return null;
            }
        } catch (error) {
            console.log(chalk.red('Error creating backup:'), error.message);
            return null;
        }
    }

    restoreLocale(languageCode, backupFile) {
        try {
            const localeFile = path.join(this.localesDir, `${languageCode}.json`);
            
            if (fs.existsSync(backupFile)) {
                fs.copyFileSync(backupFile, localeFile);
                console.log(chalk.green(`Locale restored: ${languageCode}`));
                return true;
            } else {
                console.log(chalk.red(`Backup file not found: ${backupFile}`));
                return false;
            }
        } catch (error) {
            console.log(chalk.red('Error restoring locale:'), error.message);
            return false;
        }
    }

    validateLocaleFile(languageCode) {
        try {
            const localeFile = path.join(this.localesDir, `${languageCode}.json`);
            
            if (!fs.existsSync(localeFile)) {
                return { valid: false, error: 'File not found' };
            }

            const content = fs.readFileSync(localeFile, 'utf8');
            const data = JSON.parse(content);

            const requiredSections = ['language_info', 'bot_manager', 'menu', 'messages', 'errors', 'prompts'];
            const missingSections = [];

            for (const section of requiredSections) {
                if (!data[section]) {
                    missingSections.push(section);
                }
            }

            if (missingSections.length > 0) {
                return { 
                    valid: false, 
                    error: `Missing sections: ${missingSections.join(', ')}`,
                    data: null
                };
            }

            return { valid: true, error: null, data };
        } catch (error) {
            return { valid: false, error: error.message, data: null };
        }
    }

    repairLocale(languageCode) {
        try {
            const validation = this.validateLocaleFile(languageCode);
            
            if (validation.valid) {
                console.log(chalk.green(`Locale ${languageCode} is valid`));
                return true;
            }

            console.log(chalk.yellow(`Repairing locale ${languageCode}: ${validation.error}`));
            
            const defaultLocales = this.getDefaultLocalesData();
            
            if (defaultLocales[languageCode]) {
                const localeFile = path.join(this.localesDir, `${languageCode}.json`);
                fs.writeFileSync(localeFile, JSON.stringify(defaultLocales[languageCode], null, 2));
                console.log(chalk.green(`Locale ${languageCode} repaired`));
                return true;
            } else {
                console.log(chalk.red(`No default template found for ${languageCode}`));
                return false;
            }
        } catch (error) {
            console.log(chalk.red(`Error repairing locale ${languageCode}:`), error.message);
            return false;
        }
    }

    getDefaultLocalesData() {
        return {
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
                    "found_version": "Found version: {0}",
                    "current_status": "Current system status:",
                    "select_action": "Select action:",
                    "press_enter": "Press Enter to continue...",
                    "shutting_down": "Shutting down..."
                },
                "menu": {
                    "start_bot": "Start bot",
                    "stop_bot": "Stop bot",
                    "install_deps": "Install dependencies",
                    "update_deps": "Update dependencies",
                    "deploy_guild": "Deploy commands (guild)",
                    "deploy_global": "Deploy commands (global)",
                    "system_status": "System status",
                    "change_language": "Change language",
                    "exit": "Exit"
                },
                "messages": {
                    "bot_started": "Bot started successfully! (PID: {0})",
                    "bot_stopped": "Bot stopped!",
                    "bot_already_running": "Bot is already running!",
                    "bot_not_running": "Bot is not running!",
                    "deps_installed": "Dependencies installed successfully!",
                    "config_saved": "Configuration saved!",
                    "config_reset": "Configuration reset!",
                    "commands_deployed": "Commands deployed successfully!",
                    "env_template_created": ".env template created. Please configure it manually!",
                    "env_not_configured": "Bot is not configured! Please edit .env file manually.",
                    "env_instructions": "\nTo configure the bot:\n1. Edit the .env file with your credentials\n2. Restart the bot"
                },
                "errors": {
                    "failed_to_start": "Failed to start bot: {0}",
                    "failed_to_stop": "Failed to stop bot: {0}",
                    "failed_to_install": "Failed to install dependencies!",
                    "failed_to_update": "Failed to update dependencies!",
                    "failed_to_deploy": "Failed to deploy commands: {0}"
                },
                "prompts": {
                    "continue": "Press Enter...",
                    "select_language": "Select language:"
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
                    "found_version": "Найден версии: {0}",
                    "current_status": "Текущий статус системы:",
                    "select_action": "Выберите действие:",
                    "press_enter": "Нажмите Enter для продолжения...",
                    "shutting_down": "Завершение работы..."
                },
                "menu": {
                    "start_bot": "Запустить бота",
                    "stop_bot": "Остановить бота",
                    "install_deps": "Установить зависимости",
                    "update_deps": "Обновить зависимости",
                    "deploy_guild": "Деплой команд (гильдия)",
                    "deploy_global": "Деплой команд (глобально)",
                    "system_status": "Статус системы",
                    "change_language": "Сменить язык",
                    "exit": "Выход"
                },
                "messages": {
                    "bot_started": "Бот успешно запущен! (PID: {0})",
                    "bot_stopped": "Бот остановлен!",
                    "bot_already_running": "Бот уже запущен!",
                    "bot_not_running": "Бот не запущен!",
                    "deps_installed": "Зависимости успешно установлены!",
                    "config_saved": "Настройки сохранены!",
                    "config_reset": "Конфигурация сброшена!",
                    "commands_deployed": "Команды успешно отправлены!",
                    "env_template_created": "Создан шаблон .env. Настройте его вручную!",
                    "env_not_configured": "Бот не настроен! Отредактируйте файл .env вручную.",
                    "env_instructions": "\nЧтобы настроить бота:\n1. Отредактируйте файл .env с вашими данными\n2. Перезапустите бота"
                },
                "errors": {
                    "failed_to_start": "Ошибка запуска бота: {0}",
                    "failed_to_stop": "Ошибка остановки бота: {0}",
                    "failed_to_install": "Ошибка установки зависимостей!",
                    "failed_to_update": "Ошибка обновления зависимостей!",
                    "failed_to_deploy": "Ошибка деплоя команд: {0}"
                },
                "prompts": {
                    "continue": "Нажмите Enter...",
                    "select_language": "Выберите язык:"
                },
                "help": {
                    "title": "Discord Bot Manager - Справка по командам:",
                    "main_commands": "Основные команды:",
                    "auto_commands": "Автоматические команды:",
                    "examples": "Примеры:"
                }
            }
        };
    }
}

module.exports = LocaleBackupManager;