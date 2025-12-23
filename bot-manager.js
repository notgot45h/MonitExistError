const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class LocaleManager {
    constructor() {
        this.localesDir = path.join(__dirname, 'locales');
        this.configFile = path.join(__dirname, 'language-config.json');
        this.defaultLanguage = 'en';
        this.currentLanguage = this.defaultLanguage;
        this.locales = {};
        this.availableLanguages = [];
        this.languageDisplayNames = {};
        
        this.initializeLocales();
        this.loadConfig();
        this.loadLocale(this.currentLanguage);
    }

    initializeLocales() {
        try {
            if (!fs.existsSync(this.localesDir)) {
                fs.mkdirSync(this.localesDir, { recursive: true });
                console.log(chalk.yellow('Created locales directory'));
            }
            
            this.loadAvailableLanguages();
            
            if (this.availableLanguages.length === 0) {
                console.log(chalk.yellow('No locale files found. Creating default locales...'));
                this.createDefaultLocales();
                this.loadAvailableLanguages();
            }
            
            console.log(chalk.blue(`Available languages: ${this.availableLanguages.join(', ')}`));
        } catch (error) {
            console.log(chalk.red('Error initializing locales:'), error.message);
            this.availableLanguages = [this.defaultLanguage];
        }
    }

    loadAvailableLanguages() {
        try {
            const files = fs.readdirSync(this.localesDir);
            this.availableLanguages = files
                .filter(file => file.endsWith('.json') && file !== 'language-config.json')
                .map(file => file.replace('.json', ''))
                .sort();
        } catch (error) {
            console.log(chalk.red('Error loading available languages:'), error.message);
            this.availableLanguages = [this.defaultLanguage];
        }
    }

    createDefaultLocales() {
        try {
            const defaultLocales = {
                'en': {
                    "language_info": {
                        "display_name": "English",
                        "native_name": "English"
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
                        "setup_bot": "Configure bot",
                        "install_deps": "Install dependencies",
                        "update_deps": "Update dependencies",
                        "reset_config": "Reset configuration",
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
                        "commands_deployed": "Commands deployed successfully!"
                    },
                    "errors": {
                        "failed_to_start": "Failed to start bot: {0}",
                        "failed_to_stop": "Failed to stop bot: {0}",
                        "failed_to_install": "Failed to install dependencies!",
                        "failed_to_update": "Failed to update dependencies!",
                        "failed_to_deploy": "Failed to deploy commands: {0}"
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
                        "setup_bot": "Настроить бота",
                        "install_deps": "Установить зависимости",
                        "update_deps": "Обновить зависимости",
                        "reset_config": "Сброс настроек",
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
                        "commands_deployed": "Команды успешно отправлены!"
                    },
                    "errors": {
                        "failed_to_start": "Ошибка запуска бота: {0}",
                        "failed_to_stop": "Ошибка остановки бота: {0}",
                        "failed_to_install": "Ошибка установки зависимостей!",
                        "failed_to_update": "Ошибка обновления зависимостей!",
                        "failed_to_deploy": "Ошибка деплоя команд: {0}"
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
            
        } catch (error) {
            console.log(chalk.red('Error creating default locales:'), error.message);
        }
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.currentLanguage = config.language || this.defaultLanguage;
                
                if (!this.availableLanguages.includes(this.currentLanguage)) {
                    console.log(chalk.yellow(`Configured language "${this.currentLanguage}" not found. Using default.`));
                    this.currentLanguage = this.defaultLanguage;
                    this.saveConfig();
                }
            } else {
                this.saveConfig();
            }
        } catch (error) {
            console.log(chalk.yellow('Error loading language config:'), error.message);
            this.currentLanguage = this.defaultLanguage;
        }
    }

    saveConfig() {
        try {
            const config = {
                language: this.currentLanguage,
                lastUpdated: new Date().toISOString(),
                availableLanguages: this.availableLanguages
            };
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.log(chalk.red('Error saving language config:'), error.message);
        }
    }

    loadLocale(languageCode) {
        try {
            const localeFile = path.join(this.localesDir, `${languageCode}.json`);
            
            if (!fs.existsSync(localeFile)) {
                console.log(chalk.yellow(`Locale file not found: ${languageCode}.json`));
                if (languageCode !== this.defaultLanguage) {
                    console.log(chalk.yellow(`Falling back to default language: ${this.defaultLanguage}`));
                    return this.loadLocale(this.defaultLanguage);
                }
                return false;
            }
            
            const localeData = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
            this.locales[languageCode] = localeData;
            this.currentLanguage = languageCode;
            
            if (localeData.language_info) {
                this.languageDisplayNames[languageCode] = localeData.language_info;
            }
            
            this.validateLocaleStructure(languageCode, localeData);
            
            return true;
        } catch (error) {
            console.log(chalk.red(`Error loading locale ${languageCode}:`), error.message);
            if (languageCode !== this.defaultLanguage) {
                return this.loadLocale(this.defaultLanguage);
            }
            return false;
        }
    }

    validateLocaleStructure(languageCode, localeData) {
        const requiredSections = ['bot_manager', 'menu', 'messages', 'errors', 'prompts'];
        const missingSections = [];
        
        for (const section of requiredSections) {
            if (!localeData[section]) {
                missingSections.push(section);
            }
        }
        
        if (missingSections.length > 0) {
            console.log(chalk.yellow(`Locale "${languageCode}" missing sections: ${missingSections.join(', ')}`));
        }
        
        if (!localeData.language_info || !localeData.language_info.display_name) {
            console.log(chalk.yellow(`Locale "${languageCode}" missing language_info section or display_name`));
        }
    }

    get(key, ...placeholders) {
        try {
            const keys = key.split('.');
            let value = this.locales[this.currentLanguage];
            
            if (!value) {
                value = this.locales[this.defaultLanguage];
            }
            
            for (const k of keys) {
                if (value && value[k] !== undefined) {
                    value = value[k];
                } else {
                    if (this.currentLanguage !== this.defaultLanguage) {
                        const defaultValue = this.getFromLocale(this.defaultLanguage, key, ...placeholders);
                        if (defaultValue !== key) {
                            return defaultValue;
                        }
                    }
                    return key;
                }
            }
            
            if (typeof value === 'string' && placeholders.length > 0) {
                return value.replace(/{(\d+)}/g, (match, index) => {
                    return placeholders[index] !== undefined ? placeholders[index] : match;
                });
            }
            
            return value || key;
        } catch (error) {
            return key;
        }
    }

    getFromLocale(languageCode, key, ...placeholders) {
        try {
            const keys = key.split('.');
            let value = this.locales[languageCode];
            
            if (!value) return key;
            
            for (const k of keys) {
                if (value && value[k] !== undefined) {
                    value = value[k];
                } else {
                    return key;
                }
            }
            
            if (typeof value === 'string' && placeholders.length > 0) {
                return value.replace(/{(\d+)}/g, (match, index) => {
                    return placeholders[index] !== undefined ? placeholders[index] : match;
                });
            }
            
            return value || key;
        } catch (error) {
            return key;
        }
    }

    setLanguage(languageCode) {
        this.loadAvailableLanguages();
        
        if (this.availableLanguages.includes(languageCode)) {
            if (this.loadLocale(languageCode)) {
                this.currentLanguage = languageCode;
                this.saveConfig();
                console.log(chalk.green(`Language changed to: ${languageCode.toUpperCase()}`));
                return true;
            }
        } else {
            console.log(chalk.red(`Language "${languageCode}" is not available. Available: ${this.availableLanguages.join(', ')}`));
        }
        return false;
    }

    refreshAvailableLanguages() {
        this.loadAvailableLanguages();
        this.languageDisplayNames = {};
        return this.availableLanguages;
    }

    getLanguageList() {
        const languageChoices = [];
        
        for (const langCode of this.availableLanguages) {
            let displayName = null;
            
            if (this.languageDisplayNames[langCode]) {
                displayName = `${this.languageDisplayNames[langCode].native_name} (${this.languageDisplayNames[langCode].display_name})`;
            } else {
                try {
                    const localeFile = path.join(this.localesDir, `${langCode}.json`);
                    if (fs.existsSync(localeFile)) {
                        const data = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
                        if (data.language_info) {
                            this.languageDisplayNames[langCode] = data.language_info;
                            displayName = `${data.language_info.native_name} (${data.language_info.display_name})`;
                        }
                    }
                } catch (error) {
                    console.log(chalk.yellow(`Error reading language info for ${langCode}:`), error.message);
                }
            }
            
            languageChoices.push({
                name: displayName || langCode.toUpperCase(),
                value: langCode
            });
        }
        
        return languageChoices;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, index) => {
            return args[index] !== undefined ? args[index] : match;
        });
    }
}

class BotManager {
    constructor() {
        this.isBotRunning = false;
        this.botProcess = null;
        this.pidFile = path.join(__dirname, 'bot.pid');
        this.envFile = path.join(__dirname, '.env');
        this.locale = new LocaleManager();
        
        this.handleCommandLineArgs();
    }

    async handleCommandLineArgs() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            await this.showMainMenu();
        } else {
            await this.executeCommandLineArgs(args);
        }
    }

    async executeCommandLineArgs(args) {
        console.log(chalk.blue('Discord Bot Manager - Automatic Mode\n'));
        
        for (const arg of args) {
            switch (arg) {
                case '--install':
                case '-i':
                    await this.installDependencies();
                    break;
                case '--setup':
                case '-s':
                    await this.setupConfiguration();
                    break;
                case '--start':
                    await this.startBot();
                    break;
                case '--stop':
                    await this.stopBot();
                    break;
                case '--deploy-guild':
                    await this.deployCommands('guild');
                    break;
                case '--deploy-global':
                    await this.deployCommands('global');
                    break;
                case '--update':
                    await this.updateDependencies();
                    break;
                case '--reset':
                    await this.resetConfiguration();
                    break;
                case '--status':
                    await this.showDetailedStatus();
                    break;
                case '--change-language':
                case '-l':
                    await this.changeLanguage();
                    break;
                case '--menu':
                    await this.showMainMenu();
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    break;
                case '--refresh-locales':
                    await this.refreshLocales();
                    break;
                default:
                    console.log(chalk.yellow(`Unknown argument: ${arg}`));
                    this.showHelp();
            }
        }
    }

    showHelp() {
        console.log(chalk.cyan(this.locale.get('help.title') + '\n'));
        
        console.log(this.locale.get('help.main_commands') + ':');
        console.log(chalk.green('  npm start') + '              - ' + 'Interactive menu');
        console.log(chalk.green('  node bot-manager.js --menu') + '    - ' + 'Interactive menu\n');
        
        console.log(this.locale.get('help.auto_commands') + ':');
        console.log(chalk.green('  --install, -i') + '          - ' + 'Install dependencies');
        console.log(chalk.green('  --setup, -s') + '            - ' + 'Configure bot');
        console.log(chalk.green('  --start') + '                - ' + 'Start bot');
        console.log(chalk.green('  --stop') + '                 - ' + 'Stop bot');
        console.log(chalk.green('  --deploy-guild') + '         - ' + 'Deploy guild commands');
        console.log(chalk.green('  --deploy-global') + '        - ' + 'Deploy global commands');
        console.log(chalk.green('  --update') + '               - ' + 'Update dependencies');
        console.log(chalk.green('  --reset') + '                - ' + 'Reset configuration');
        console.log(chalk.green('  --status') + '               - ' + 'System status');
        console.log(chalk.green('  --change-language, -l') + '   - ' + 'Change interface language');
        console.log(chalk.green('  --refresh-locales') + '       - ' + 'Refresh available locales');
        console.log(chalk.green('  --help, -h') + '             - ' + 'This help\n');
        
        console.log(this.locale.get('help.examples') + ':');
        console.log(chalk.cyan('  node bot-manager.js --install --setup --start'));
        console.log(chalk.cyan('  npm start'));
        process.exit(0);
    }

    async showMainMenu() {
        console.clear();
        await this.checkSystemStatus();
        
        const { action } = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: this.locale.get('bot_manager.select_action'),
            choices: [
                { name: this.locale.get('menu.start_bot'), value: 'start' },
                { name: this.locale.get('menu.stop_bot'), value: 'stop' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.change_language'), value: 'change-language' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.setup_bot'), value: 'setup' },
                { name: this.locale.get('menu.install_deps'), value: 'install' },
                { name: this.locale.get('menu.update_deps'), value: 'update' },
                { name: this.locale.get('menu.reset_config'), value: 'reset' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.deploy_guild'), value: 'deploy-guild' },
                { name: this.locale.get('menu.deploy_global'), value: 'deploy-global' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.system_status'), value: 'status' },
                { name: this.locale.get('menu.exit'), value: 'exit' }
            ],
            pageSize: 15
        });

        await this.handleAction(action);
    }

    async refreshLocales() {
        console.log(chalk.cyan('\nRefreshing available locales...'));
        const availableLanguages = this.locale.refreshAvailableLanguages();
        console.log(chalk.green(`Found ${availableLanguages.length} locales: ${availableLanguages.join(', ')}`));
    }

    async checkSystemStatus() {
        this.isBotRunning = await this.checkBotProcess();
        const systemStatus = await this.getSystemStatus();
        
        console.log(chalk.blue(this.locale.get('bot_manager.current_status')));
        console.log(chalk.white('┌──────────────────'));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}               {1}',
            this.locale.get('bot_manager.bot'),
            systemStatus.bot
        )));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}       {1}',
            this.locale.get('bot_manager.dependencies'),
            systemStatus.dependencies
        )));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}      {1}',
            this.locale.get('bot_manager.configuration'),
            systemStatus.config
        )));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}           {1}',
            this.locale.get('bot_manager.nodejs'),
            systemStatus.node
        )));
        console.log(chalk.white('└──────────────────\n'));
    }

    async getSystemStatus() {
        const botStatus = this.isBotRunning ? 
            chalk.green(this.locale.get('bot_manager.running')) : 
            chalk.red(this.locale.get('bot_manager.stopped'));
        
        const depsStatus = fs.existsSync('node_modules') ? 
            chalk.green(this.locale.get('bot_manager.installed')) : 
            chalk.red(this.locale.get('bot_manager.missing'));
        
        const configStatus = await this.validateConfig() ? 
            chalk.green(this.locale.get('bot_manager.configured')) : 
            chalk.red(this.locale.get('bot_manager.not_configured'));
        
        const nodeStatus = await this.checkNodeJS() ? 
            chalk.green(this.locale.formatString(
                this.locale.get('bot_manager.found_version'),
                process.version
            )) : 
            chalk.red(this.locale.get('bot_manager.not_installed'));

        return { 
            bot: botStatus, 
            dependencies: depsStatus, 
            config: configStatus, 
            node: nodeStatus
        };
    }

    async handleAction(action) {
        switch (action) {
            case 'start':
                await this.startBot();
                break;
            case 'stop':
                await this.stopBot();
                break;
            case 'change-language':
                await this.changeLanguage();
                break;
            case 'setup':
                await this.setupConfiguration();
                break;
            case 'install':
                await this.installDependencies();
                break;
            case 'update':
                await this.updateDependencies();
                break;
            case 'reset':
                await this.resetConfiguration();
                break;
            case 'deploy-guild':
                await this.deployCommands('guild');
                break;
            case 'deploy-global':
                await this.deployCommands('global');
                break;
            case 'status':
                await this.showDetailedStatus();
                break;
            case 'exit':
                this.exit();
                break;
        }
        
        if (action !== 'exit') {
            await this.waitForEnter();
        }
    }

    async changeLanguage() {
        this.locale.refreshAvailableLanguages();
        
        const languageChoices = this.locale.getLanguageList();
        
        if (languageChoices.length === 0) {
            console.log(chalk.red('No languages available!'));
            return;
        }
        
        const { selectedLanguage } = await inquirer.prompt({
            type: 'list',
            name: 'selectedLanguage',
            message: this.locale.get('prompts.select_language'),
            choices: languageChoices
        });
        
        this.locale.setLanguage(selectedLanguage);
    }

    async checkNodeJS() {
        try {
            execSync('node --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    async checkNPM() {
        try {
            execSync('npm --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    async checkBotProcess() {
        if (!fs.existsSync(this.pidFile)) return false;
        
        try {
            const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
            if (process.platform === 'win32') {
                execSync(`tasklist /fi "pid eq ${pid}" | findstr ${pid}`);
            } else {
                process.kill(pid, 0);
            }
            return true;
        } catch {
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            return false;
        }
    }

    async validateConfig() {
        try {
            if (!fs.existsSync(this.envFile)) return false;
        
            const envContent = fs.readFileSync(this.envFile, 'utf8');
            const hasToken = envContent.includes('DISCORD_TOKEN') && 
                          !envContent.includes('your_bot_token_here') &&
                        envContent.match(/DISCORD_TOKEN=[A-Za-z0-9._-]{59,60}/);
        
            const hasClientId = envContent.includes('CLIENT_ID') && 
                          !envContent.includes('your_client_id_here');
            const hasGuildId = envContent.includes('GUILD_ID') && 
                         !envContent.includes('your_guild_id_here');
        
            return hasToken && hasClientId && hasGuildId;
        } catch {
            return false;
        }
    }

    async runCommand(command, message = 'Executing command...') {
        return new Promise((resolve, reject) => {
            if (message) console.log(chalk.blue(`${message}`));
            
            const child = exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(chalk.red(`Error: ${error.message}`));
                    reject(error);
                    return;
                }
                
                if (stdout) console.log(chalk.gray(stdout));
                if (stderr) console.log(chalk.yellow(stderr));
                
                resolve({ stdout, stderr });
            });
        });
    }

    async installDependencies() {
        console.log(chalk.cyan('\n' + this.locale.get('menu.install_deps') + '...'));
        
        if (!await this.checkNodeJS()) {
            console.log(chalk.red('Node.js is not installed!'));
            console.log(chalk.yellow('Download from: https://nodejs.org/'));
            return false;
        }

        if (!await this.checkNPM()) {
            console.log(chalk.red('npm not found!'));
            console.log(chalk.yellow('Reinstall Node.js'));
            return false;
        }

        try {
            await this.runCommand('npm cache clean --force', 'Cleaning npm cache...');
            
            await this.runCommand('npm install --no-fund --no-audit', 'Installing dependencies...');

            if (!fs.existsSync(this.envFile)) {
                await this.createDefaultEnv();
            }

            console.log(chalk.green(this.locale.get('messages.deps_installed')));
            return true;
        } catch (error) {
            console.log(chalk.red(this.locale.get('errors.failed_to_install')));
            return false;
        }
    }

    async createDefaultEnv() {
        const defaultEnv = `DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here`;

        fs.writeFileSync(this.envFile, defaultEnv);
        console.log(chalk.yellow('Created .env file with default settings'));
    }

    async setupConfiguration() {
        console.log(chalk.cyan('\n' + this.locale.get('menu.setup_bot') + '...'));

        console.log(chalk.yellow('Warning: Token will be displayed during input for verification.'));
        console.log(chalk.yellow('Make sure no one can see your screen!\n'));

        const questions = [
            {
                type: 'input',
                name: 'token',
                message: this.locale.get('prompts.enter_token'),
                validate: input => {
                    if (!input) return this.locale.get('prompts.token_empty');
                    if (input.includes('your_bot_token_here')) return 'Replace your_bot_token_here with real token!';
                    return true;
                }
            },
            {
                type: 'input',
                name: 'clientId',
                message: this.locale.get('prompts.enter_client_id'),
                validate: input => {
                    const cleanId = input.replace(/\D/g, '');
                    return cleanId.length > 0 ? true : this.locale.get('prompts.client_id_invalid');
                }
            },
            {
                type: 'input',
                name: 'guildId',
                message: this.locale.get('prompts.enter_guild_id'),
                validate: input => {
                    const cleanId = input.replace(/\D/g, '');
                    return cleanId.length > 0 ? true : this.locale.get('prompts.guild_id_invalid');
                }
            }
        ];

        const answers = await inquirer.prompt(questions);

        const cleanClientId = answers.clientId.replace(/\D/g, '');
        const cleanGuildId = answers.guildId.replace(/\D/g, '');

        const envContent = `DISCORD_TOKEN=${answers.token}
CLIENT_ID=${cleanClientId}
GUILD_ID=${cleanGuildId}`;

        fs.writeFileSync(this.envFile, envContent);

        console.log(chalk.green('\n' + this.locale.get('messages.config_saved')));
        console.log(chalk.blue(`Bot ID: ${cleanClientId}`));
        console.log(chalk.blue(`Server ID: ${cleanGuildId}`));
        console.log(chalk.green(`Token: ${answers.token.substring(0, 10)}...`));
        console.log(chalk.yellow('\nMake sure the .env file is protected and not uploaded to public repositories!'));
    }

    async startBot() {
        console.log(chalk.cyan('\n' + this.locale.get('menu.start_bot') + '...'));

        if (!fs.existsSync('node_modules')) {
            console.log(chalk.yellow('Dependencies not installed. Installing...'));
            const installed = await this.installDependencies();
            if (!installed) {
                console.log(chalk.red(this.locale.get('errors.failed_to_install')));
                return;
            }
        }

        if (!await this.validateConfig()) {
            console.log(chalk.yellow('Configuration not filled. Starting setup...'));
            await this.setupConfiguration();
        }

        if (await this.checkBotProcess()) {
            console.log(chalk.yellow(this.locale.get('messages.bot_already_running')));
            return;
        }

        try {
            this.botProcess = spawn('node', ['index.js'], {
                detached: true,
                stdio: 'ignore'
            });

            fs.writeFileSync(this.pidFile, this.botProcess.pid.toString());
            
            this.botProcess.unref();
            this.isBotRunning = true;

            console.log(chalk.green(this.locale.formatString(
                this.locale.get('messages.bot_started'),
                this.botProcess.pid
            )));
            console.log(chalk.blue('Use "Stop bot" to stop the bot'));
            
        } catch (error) {
            console.log(chalk.red(this.locale.formatString(
                this.locale.get('errors.failed_to_start'),
                error.message
            )));
        }
    }

    async stopBot() {
        console.log(chalk.cyan('\n' + this.locale.get('menu.stop_bot') + '...'));

        if (!await this.checkBotProcess()) {
            console.log(chalk.yellow(this.locale.get('messages.bot_not_running')));
            return;
        }

        try {
            const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
            
            if (process.platform === 'win32') {
                execSync(`taskkill /pid ${pid} /f /t`);
            } else {
                process.kill(pid, 'SIGTERM');
            }
            
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            
            this.isBotRunning = false;
            console.log(chalk.green(this.locale.get('messages.bot_stopped')));
            
        } catch (error) {
            console.log(chalk.red(this.locale.formatString(
                this.locale.get('errors.failed_to_stop'),
                error.message
            )));
            
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        }
    }

    async deployCommands(type) {
        console.log(chalk.cyan('\n' + this.locale.get(type === 'guild' ? 'menu.deploy_guild' : 'menu.deploy_global') + '...'));

        if (!await this.validateConfig()) {
            console.log(chalk.red('Configuration not filled!'));
            console.log(chalk.yellow('First configure the bot.'));
            return;
        }

        const scriptName = type === 'guild' ? 'deploy-commands-guild.js' : 'deploy-commands-global.js';
        const message = type === 'guild' ? 
            'Commands appear instantly!' : 
            'Commands appear within 24 hours';

        console.log(chalk.yellow(`${message}`));

        try {
            await this.runCommand(`node ${scriptName}`, 'Sending commands to Discord...');
            console.log(chalk.green(this.locale.get('messages.commands_deployed')));
        } catch (error) {
            console.log(chalk.red(this.locale.formatString(
                this.locale.get('errors.failed_to_deploy'),
                error.message
            )));
        }
    }

    async updateDependencies() {
        console.log(chalk.cyan('\n' + this.locale.get('menu.update_deps') + '...'));
        
        try {
            await this.runCommand('npm update --no-fund --no-audit', 'Updating packages...');
            console.log(chalk.green(this.locale.get('messages.deps_installed')));
        } catch (error) {
            console.log(chalk.red(this.locale.get('errors.failed_to_update')));
        }
    }

    async resetConfiguration() {
        console.log(chalk.cyan('\n' + this.locale.get('menu.reset_config') + '...'));

        if (fs.existsSync(this.envFile)) {
            fs.unlinkSync(this.envFile);
            console.log(chalk.green('.env file deleted!'));
        } else {
            console.log(chalk.yellow('.env file not found.'));
        }

        const { createNew } = await inquirer.prompt({
            type: 'confirm',
            name: 'createNew',
            message: this.locale.get('prompts.create_new_config'),
            default: true
        });

        if (createNew) {
            await this.setupConfiguration();
        } else {
            console.log(chalk.blue('You can create configuration later with "Configure bot" command'));
        }
    }

    async showDetailedStatus() {
        console.clear();
        console.log(chalk.cyan.bold('\n' + this.locale.get('menu.system_status') + '\n'));

        const status = await this.getSystemStatus();
        
        console.log(chalk.white('┌──────────────────'));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}               {1}',
            this.locale.get('bot_manager.bot'),
            status.bot
        )));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}       {1}',
            this.locale.get('bot_manager.dependencies'),
            status.dependencies
        )));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}      {1}',
            this.locale.get('bot_manager.configuration'),
            status.config
        )));
        console.log(chalk.white(this.locale.formatString(
            '│ {0}           {1}',
            this.locale.get('bot_manager.nodejs'),
            status.node
        )));
        console.log(chalk.white('└──────────────────'));

        console.log(chalk.cyan('\nConfiguration details:'));
        if (await this.validateConfig()) {
            try {
                const envContent = fs.readFileSync(this.envFile, 'utf8');
                const lines = envContent.split('\n');
                
                lines.forEach(line => {
                    if (line.startsWith('DISCORD_TOKEN=')) {
                        const token = line.replace('DISCORD_TOKEN=', '');
                        console.log(chalk.green(`DISCORD_TOKEN: ${token.substring(0, 10)}...`));
                    } else if (line.startsWith('CLIENT_ID=')) {
                        const clientId = line.replace('CLIENT_ID=', '');
                        console.log(chalk.blue(`Client ID: ${clientId}`));
                    } else if (line.startsWith('GUILD_ID=')) {
                        const guildId = line.replace('GUILD_ID=', '');
                        console.log(chalk.blue(`Guild ID: ${guildId}`));
                    }
                });
            } catch (e) {
                console.log(chalk.red('Failed to read .env file'));
            }
        } else {
            console.log(chalk.red('Configuration not filled'));
        }

        console.log(chalk.cyan('\nLanguage settings:'));
        console.log(chalk.blue(`Current language: ${this.locale.getCurrentLanguage().toUpperCase()}`));
        console.log(chalk.blue(`Available languages: ${this.locale.availableLanguages.join(', ')}`));

        console.log(chalk.cyan('\nAvailable commands:'));
        if (fs.existsSync('commands')) {
            let totalCommands = 0;
            const commandFolders = fs.readdirSync('commands');
            
            commandFolders.forEach(folder => {
                const folderPath = path.join('commands', folder);
                if (fs.statSync(folderPath).isDirectory()) {
                    const commands = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                    totalCommands += commands.length;
                    console.log(chalk.blue(`${folder}: ${commands.length} commands`));
                }
            });
            
            console.log(chalk.green(`Total commands: ${totalCommands}`));
        } else {
            console.log(chalk.red('Commands folder not found'));
        }

        if (this.isBotRunning && fs.existsSync(this.pidFile)) {
            const pid = fs.readFileSync(this.pidFile, 'utf8');
            console.log(chalk.cyan('\nProcess information:'));
            console.log(chalk.blue(`PID: ${pid}`));
            console.log(chalk.blue(`Platform: ${process.platform}`));
        }
    }

    async waitForEnter() {
        console.log(chalk.gray('\n' + this.locale.get('bot_manager.press_enter')));
        
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: this.locale.get('prompts.continue')
            }
        ]);
        
        await this.showMainMenu();
    }

    exit() {
        console.log(chalk.cyan('\n' + this.locale.get('bot_manager.shutting_down')));
        
        if (this.isBotRunning) {
            console.log(chalk.yellow('Stopping bot before exit...'));
            this.stopBot().then(() => {
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
}

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nForce shutdown...'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\nShutting down...'));
    process.exit(0);
});

new BotManager();