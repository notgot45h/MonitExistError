const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const LocaleBackupManager = require('./locale-backup-manager');
const Logger = require('./logger');

class LocaleManager {
    constructor(logger) {
        this.logger = logger;
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
                this.logger.system('Created locales directory');
            }
            
            this.loadAvailableLanguages();
            
            if (this.availableLanguages.length === 0) {
                this.logger.warn('No locale files found. Creating default locales...');
                const backupManager = new LocaleBackupManager(this.localesDir);
                backupManager.createDefaultLocales();
                this.loadAvailableLanguages();
            }
            
            this.logger.info(`Available languages: ${this.availableLanguages.join(', ')}`);
        } catch (error) {
            this.logger.error('Error initializing locales', error);
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
            
            for (const langCode of this.availableLanguages) {
                try {
                    const localeFile = path.join(this.localesDir, `${langCode}.json`);
                    if (fs.existsSync(localeFile)) {
                        const data = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
                        if (data.language_info) {
                            this.languageDisplayNames[langCode] = data.language_info;
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Error reading language info for ${langCode}: ${error.message}`);
                }
            }
        } catch (error) {
            this.logger.error('Error loading available languages', error);
            this.availableLanguages = [this.defaultLanguage];
        }
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.currentLanguage = config.language || this.defaultLanguage;
                
                if (!this.availableLanguages.includes(this.currentLanguage)) {
                    this.logger.warn(`Configured language "${this.currentLanguage}" not found. Using default.`);
                    this.currentLanguage = this.defaultLanguage;
                    this.saveConfig();
                }
            } else {
                this.saveConfig();
            }
        } catch (error) {
            this.logger.error('Error loading language config', error);
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
            this.logger.debug(`Language config saved: ${this.currentLanguage}`);
        } catch (error) {
            this.logger.error('Error saving language config', error);
        }
    }

    loadLocale(languageCode) {
        try {
            const localeFile = path.join(this.localesDir, `${languageCode}.json`);
            
            if (!fs.existsSync(localeFile)) {
                this.logger.warn(`Locale file not found: ${languageCode}.json`);
                if (languageCode !== this.defaultLanguage) {
                    this.logger.warn(`Falling back to default language: ${this.defaultLanguage}`);
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
            
            this.logger.info(`Locale loaded: ${languageCode}`);
            return true;
        } catch (error) {
            this.logger.error(`Error loading locale ${languageCode}`, error);
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
            this.logger.warn(`Locale "${languageCode}" missing sections: ${missingSections.join(', ')}`);
        }
        
        if (!localeData.language_info || !localeData.language_info.display_name) {
            this.logger.warn(`Locale "${languageCode}" missing language_info section or display_name`);
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
            this.logger.error(`Error getting locale key: ${key}`, error);
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
                this.logger.info(`Language changed to: ${languageCode.toUpperCase()}`);
                return true;
            }
        } else {
            this.logger.error(`Language "${languageCode}" is not available. Available: ${this.availableLanguages.join(', ')}`);
        }
        return false;
    }

    refreshAvailableLanguages() {
        this.loadAvailableLanguages();
        return this.availableLanguages;
    }

    getLanguageList() {
        const languageChoices = [];
        
        for (const langCode of this.availableLanguages) {
            let displayName = null;
            
            if (this.languageDisplayNames[langCode]) {
                displayName = `${this.languageDisplayNames[langCode].display_name} (${this.languageDisplayNames[langCode].native_name})`;
            } else {
                try {
                    const localeFile = path.join(this.localesDir, `${langCode}.json`);
                    if (fs.existsSync(localeFile)) {
                        const data = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
                        if (data.language_info) {
                            this.languageDisplayNames[langCode] = data.language_info;
                            displayName = `${data.language_info.display_name} (${data.language_info.native_name})`;
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Error reading language info for ${langCode}: ${error.message}`);
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

class PluginManagerMenu {
    constructor(botManager, locale) {
        this.botManager = botManager;
        this.locale = locale;
        this.pluginsDir = path.join(__dirname, 'plugins');
        this.configFile = path.join(this.pluginsDir, 'plugins-config.json');
        
        this.initializePluginsDirectory();
    }

    initializePluginsDirectory() {
        try {
            if (!fs.existsSync(this.pluginsDir)) {
                fs.mkdirSync(this.pluginsDir, { recursive: true });
                this.botManager.logger.system('Created plugins directory');
            }
        } catch (error) {
            this.botManager.logger.error('Failed to initialize plugins directory', error);
        }
    }

    scanPlugins() {
        try {
            if (!fs.existsSync(this.pluginsDir)) return [];
            
            const pluginFolders = fs.readdirSync(this.pluginsDir).filter(folder => {
                const pluginPath = path.join(this.pluginsDir, folder);
                return fs.statSync(pluginPath).isDirectory();
            });
            
            return pluginFolders;
        } catch (error) {
            this.botManager.logger.error('Failed to scan plugins', error);
            return [];
        }
    }

    getPluginInfo(pluginName) {
        const pluginPath = path.join(this.pluginsDir, pluginName);
        const packageFile = path.join(pluginPath, 'package.json');
        const pluginFile = path.join(pluginPath, 'index.js');
        
        if (!fs.existsSync(pluginFile)) return null;
        
        try {
            let pluginInfo = {
                name: pluginName,
                path: pluginPath,
                main: pluginFile,
                enabled: false
            };
            
            if (fs.existsSync(packageFile)) {
                const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
                pluginInfo = { ...pluginInfo, ...packageData };
            }
            
            if (fs.existsSync(this.configFile)) {
                const configData = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                if (configData.plugins && configData.plugins[pluginName]) {
                    pluginInfo.enabled = configData.plugins[pluginName].enabled || false;
                }
            }
            
            return pluginInfo;
        } catch (error) {
            this.botManager.logger.error(`Failed to get plugin info for ${pluginName}`, error);
            return null;
        }
    }

    getPluginList() {
        const pluginFolders = this.scanPlugins();
        const plugins = [];
        
        for (const pluginName of pluginFolders) {
            const info = this.getPluginInfo(pluginName);
            if (info) {
                plugins.push({
                    name: info.name,
                    enabled: info.enabled,
                    description: info.description || 'No description',
                    version: info.version || '1.0.0',
                    author: info.author || 'Unknown'
                });
            }
        }
        
        return plugins;
    }

    togglePlugin(pluginName, enabled) {
        try {
            let configData = { plugins: {} };
            
            if (fs.existsSync(this.configFile)) {
                configData = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            }
            
            if (!configData.plugins) configData.plugins = {};
            
            const pluginInfo = this.getPluginInfo(pluginName);
            const currentConfig = configData.plugins[pluginName] || {};
            
            configData.plugins[pluginName] = {
                ...currentConfig,
                enabled: enabled,
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(this.configFile, JSON.stringify(configData, null, 2));
            
            this.botManager.logger.info(`Plugin ${pluginName} ${enabled ? 'enabled' : 'disabled'}`);
            return true;
        } catch (error) {
            this.botManager.logger.error(`Failed to toggle plugin ${pluginName}`, error);
            return false;
        }
    }

    async showPluginMenu() {
        console.clear();
        console.log(chalk.cyan.bold('\n=== Plugin Manager ===\n'));
        
        const plugins = this.getPluginList();
        
        if (plugins.length === 0) {
            console.log(chalk.yellow('No plugins found in the plugins directory.'));
            console.log(chalk.cyan('\nTo add a plugin:'));
            console.log(chalk.blue('  1. Create a folder in the plugins directory'));
            console.log(chalk.blue('  2. Add an index.js file with plugin code'));
            console.log(chalk.blue('  3. (Optional) Add package.json with plugin info'));
            console.log(chalk.blue(`\nPlugins directory: ${this.pluginsDir}`));
            
            await this.botManager.waitForEnter();
            return;
        }
        
        console.log(chalk.blue(`Found ${plugins.length} plugin(s):\n`));
        
        plugins.forEach((plugin, index) => {
            const status = plugin.enabled ? 
                chalk.green('[ENABLED]') : 
                chalk.red('[DISABLED]');
            
            console.log(chalk.white(`${index + 1}. ${plugin.name} ${status}`));
            console.log(chalk.gray(`   Version: ${plugin.version} | Author: ${plugin.author}`));
            console.log(chalk.gray(`   ${plugin.description}`));
            console.log('');
        });
        
        const { action } = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: 'Select action:',
            choices: [
                { name: 'Enable plugin', value: 'enable' },
                { name: 'Disable plugin', value: 'disable' },
                { name: 'Reload plugin list', value: 'reload' },
                { name: 'Back to main menu', value: 'back' }
            ]
        });
        
        switch (action) {
            case 'enable':
                await this.enablePluginMenu();
                break;
            case 'disable':
                await this.disablePluginMenu();
                break;
            case 'reload':
                await this.showPluginMenu();
                break;
            case 'back':
                break;
        }
    }

    async enablePluginMenu() {
        const plugins = this.getPluginList();
        const disabledPlugins = plugins.filter(p => !p.enabled);
        
        if (disabledPlugins.length === 0) {
            console.log(chalk.yellow('No disabled plugins available.'));
            await this.botManager.waitForEnter();
            await this.showPluginMenu();
            return;
        }
        
        const choices = disabledPlugins.map(plugin => ({
            name: `${plugin.name} (${plugin.description})`,
            value: plugin.name
        }));
        
        choices.push({ name: 'Cancel', value: 'cancel' });
        
        const { pluginName } = await inquirer.prompt({
            type: 'list',
            name: 'pluginName',
            message: 'Select plugin to enable:',
            choices: choices
        });
        
        if (pluginName === 'cancel') {
            await this.showPluginMenu();
            return;
        }
        
        if (this.togglePlugin(pluginName, true)) {
            console.log(chalk.green(`Plugin "${pluginName}" enabled successfully!`));
            console.log(chalk.yellow('Note: Bot needs to be restarted for changes to take effect.'));
        } else {
            console.log(chalk.red(`Failed to enable plugin "${pluginName}"`));
        }
        
        await this.botManager.waitForEnter();
        await this.showPluginMenu();
    }

    async disablePluginMenu() {
        const plugins = this.getPluginList();
        const enabledPlugins = plugins.filter(p => p.enabled);
        
        if (enabledPlugins.length === 0) {
            console.log(chalk.yellow('No enabled plugins available.'));
            await this.botManager.waitForEnter();
            await this.showPluginMenu();
            return;
        }
        
        const choices = enabledPlugins.map(plugin => ({
            name: `${plugin.name} (${plugin.description})`,
            value: plugin.name
        }));
        
        choices.push({ name: 'Cancel', value: 'cancel' });
        
        const { pluginName } = await inquirer.prompt({
            type: 'list',
            name: 'pluginName',
            message: 'Select plugin to disable:',
            choices: choices
        });
        
        if (pluginName === 'cancel') {
            await this.showPluginMenu();
            return;
        }
        
        if (this.togglePlugin(pluginName, false)) {
            console.log(chalk.green(`Plugin "${pluginName}" disabled successfully!`));
            console.log(chalk.yellow('Note: Bot needs to be restarted for changes to take effect.'));
        } else {
            console.log(chalk.red(`Failed to disable plugin "${pluginName}"`));
        }
        
        await this.botManager.waitForEnter();
        await this.showPluginMenu();
    }
}

class BotManager {
    constructor() {
        this.logger = new Logger();
        this.logger.setConsoleOutput(false);
        
        this.isBotRunning = false;
        this.botProcess = null;
        this.pidFile = path.join(__dirname, 'bot.pid');
        this.envFile = path.join(__dirname, '.env');
        this.locale = new LocaleManager(this.logger);
        this.pluginManager = new PluginManagerMenu(this, this.locale);
        
        this.logger.system('BotManager initialized');
        this.handleCommandLineArgs();
    }

    async handleCommandLineArgs() {
        const args = process.argv.slice(2);
        this.logger.logCommand('bot-manager.js', args);
        
        if (args.length === 0) {
            await this.showMainMenu();
        } else {
            await this.executeCommandLineArgs(args);
        }
    }

    async executeCommandLineArgs(args) {
        this.logger.info('Discord Bot Manager - Plugin System');
        
        for (const arg of args) {
            this.logger.info(`Processing argument: ${arg}`);
            switch (arg) {
                case '--install':
                case '-i':
                    await this.installDependencies();
                    break;
                case '--create-env':
                    await this.createEnvTemplate();
                    break;
                case '--start':
                    await this.startBot();
                    break;
                case '--stop':
                    await this.stopBot();
                    break;
                case '--update':
                    await this.updateDependencies();
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
                case '--plugins':
                    await this.pluginManager.showPluginMenu();
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    break;
                case '--refresh-locales':
                    await this.refreshLocales();
                    break;
                case '--repair-locales':
                    await this.repairLocales();
                    break;
                case '--view-logs':
                    this.viewLogs();
                    break;
                case '--clear-logs':
                    this.clearLogs();
                    break;
                default:
                    this.logger.warn(`Unknown argument: ${arg}`);
                    this.showHelp();
            }
        }
    }

    showHelp() {
        console.log(chalk.cyan('Discord Bot Manager - Plugin System\n'));
        
        console.log('Main commands:');
        console.log(chalk.green('  npm start') + '              - Interactive menu');
        console.log(chalk.green('  node bot-manager.js --menu') + '    - Interactive menu\n');
        
        console.log('Plugin System Commands:');
        console.log(chalk.green('  --plugins') + '              - Manage plugins\n');
        
        console.log('System Commands:');
        console.log(chalk.green('  --install, -i') + '          - Install dependencies');
        console.log(chalk.green('  --create-env') + '            - Create .env template file');
        console.log(chalk.green('  --start') + '                - Start bot');
        console.log(chalk.green('  --stop') + '                 - Stop bot');
        console.log(chalk.green('  --update') + '               - Update dependencies');
        console.log(chalk.green('  --status') + '               - System status');
        console.log(chalk.green('  --change-language, -l') + '   - Change interface language');
        console.log(chalk.green('  --refresh-locales') + '       - Refresh available locales');
        console.log(chalk.green('  --repair-locales') + '        - Repair corrupted locale files');
        console.log(chalk.green('  --view-logs') + '            - View recent logs');
        console.log(chalk.green('  --clear-logs') + '           - Clear all logs');
        console.log(chalk.green('  --help, -h') + '             - This help\n');
        
        console.log('Examples:');
        console.log(chalk.cyan('  node bot-manager.js --install --create-env --start'));
        console.log(chalk.cyan('  node bot-manager.js --plugins'));
        
        this.logger.info('Help displayed');
        process.exit(0);
    }

    async showMainMenu() {
        console.clear();
        await this.checkSystemStatus();
        
        this.logger.info('Displaying main menu');
        
        const { action } = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: this.locale.get('bot_manager.select_action'),
            choices: [
                { name: this.locale.get('menu.start_bot'), value: 'start' },
                { name: this.locale.get('menu.stop_bot'), value: 'stop' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.manage_plugins'), value: 'plugins' },
                { name: this.locale.get('menu.change_language'), value: 'change-language' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.install_deps'), value: 'install' },
                { name: this.locale.get('menu.update_deps'), value: 'update' },
                new inquirer.Separator(),
                { name: this.locale.get('menu.system_status'), value: 'status' },
                { name: this.locale.get('menu.exit'), value: 'exit' }
            ],
            pageSize: 15
        });

        this.logger.logInteraction('menu_selection', { action });
        await this.handleAction(action);
    }

    async refreshLocales() {
        this.logger.info('Refreshing available locales...');
        const availableLanguages = this.locale.refreshAvailableLanguages();
        this.logger.info(`Found ${availableLanguages.length} locales: ${availableLanguages.join(', ')}`);
    }

    async repairLocales() {
        this.logger.info('Repairing locale files...');
        const backupManager = new LocaleBackupManager(this.locale.localesDir);
        
        for (const langCode of this.locale.availableLanguages) {
            const result = backupManager.repairLocale(langCode);
            if (result) {
                this.logger.info(`  ✓ ${langCode}: repaired`);
            } else {
                this.logger.warn(`  ⚠ ${langCode}: could not repair`);
            }
        }
        
        this.logger.info('Locale repair completed!');
        this.locale.refreshAvailableLanguages();
    }

    viewLogs() {
        const logs = this.logger.getRecentLogs(100);
        console.log(chalk.cyan('\nRecent logs (last 100 lines):\n'));
        logs.forEach(log => console.log(chalk.gray(log)));
        console.log(chalk.cyan('\nTotal log lines:'), this.logger.getLogStats().lines);
        console.log(chalk.cyan('Log file:'), this.logger.getLogStats().path);
        process.exit(0);
    }

    clearLogs() {
        if (this.logger.clearLogs()) {
            console.log(chalk.green('Logs cleared successfully!'));
        } else {
            console.log(chalk.red('Failed to clear logs!'));
        }
        process.exit(0);
    }

    async checkSystemStatus() {
        this.isBotRunning = await this.checkBotProcess();
        const systemStatus = await this.getSystemStatus();
        
        this.logger.info('Checking system status');
        this.logger.debug(`Bot running: ${this.isBotRunning}`);
        
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
        
        const plugins = this.pluginManager.getPluginList();
        const enabledPlugins = plugins.filter(p => p.enabled).length;
        console.log(chalk.white(this.locale.formatString(
            '│ {0}            {1}/{2}',
            this.locale.get('menu.plugins'),
            enabledPlugins,
            plugins.length
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
        this.logger.info(`Handling action: ${action}`);
        
        switch (action) {
            case 'start':
                await this.startBot();
                break;
            case 'stop':
                await this.stopBot();
                break;
            case 'plugins':
                await this.pluginManager.showPluginMenu();
                await this.waitForEnter();
                break;
            case 'change-language':
                const changed = await this.changeLanguage();
                if (changed) {
                    console.log(chalk.green(`Language changed to ${this.locale.getCurrentLanguage().toUpperCase()}`));
                }
                await this.waitForEnter();
                break;
            case 'install':
                await this.installDependencies();
                break;
            case 'update':
                await this.updateDependencies();
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
            this.logger.error('No languages available!');
            console.log(chalk.red('No languages available!'));
            return false;
        }
        
        const { selectedLanguage } = await inquirer.prompt({
            type: 'list',
            name: 'selectedLanguage',
            message: this.locale.get('prompts.select_language'),
            choices: languageChoices
        });
        
        this.logger.logInteraction('language_change', { 
            from: this.locale.getCurrentLanguage(), 
            to: selectedLanguage 
        });
        
        const success = this.locale.setLanguage(selectedLanguage);
        
        if (success) {
            console.log(chalk.green(`Language changed to ${this.locale.getCurrentLanguage().toUpperCase()}`));
            console.log(chalk.yellow('Restart the menu to see changes in the interface.'));
        } else {
            console.log(chalk.red('Failed to change language!'));
        }
        
        return success;
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
                          !envContent.includes('your_bot_token_here');
            
            const hasClientId = envContent.includes('CLIENT_ID') && 
                          !envContent.includes('your_client_id_here');
            
            const hasGuildId = envContent.includes('GUILD_ID') && 
                         !envContent.includes('your_guild_id_here');
        
            return hasToken && hasClientId && hasGuildId;
        } catch (error) {
            this.logger.error('Error validating config', error);
            return false;
        }
    }

    async runCommand(command, message = 'Executing command...') {
        this.logger.info(message);
        
        return new Promise((resolve, reject) => {
            const child = exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.logger.error(`Command failed: ${command}`, error);
                    reject(error);
                    return;
                }
                
                if (stdout) {
                    this.logger.debug(`stdout: ${stdout}`);
                }
                if (stderr) {
                    this.logger.warn(`stderr: ${stderr}`);
                }
                
                this.logger.info(`Command completed: ${command}`);
                resolve({ stdout, stderr });
            });
        });
    }

    async installDependencies() {
        this.logger.info(this.locale.get('menu.install_deps') + '...');
        console.log(chalk.cyan('\n' + this.locale.get('menu.install_deps') + '...'));
        
        if (!await this.checkNodeJS()) {
            this.logger.error('Node.js is not installed!');
            console.log(chalk.red(this.locale.get('errors.nodejs_not_installed')));
            console.log(chalk.yellow('Download from: https://nodejs.org/'));
            return false;
        }

        if (!await this.checkNPM()) {
            this.logger.error('npm not found!');
            console.log(chalk.red(this.locale.get('errors.npm_not_found')));
            console.log(chalk.yellow('Reinstall Node.js'));
            return false;
        }

        try {
            await this.runCommand('npm cache clean --force', 'Cleaning npm cache...');
            
            await this.runCommand('npm install --no-fund --no-audit', 'Installing dependencies...');

            if (!fs.existsSync(this.envFile)) {
                this.logger.warn('.env file not found, creating template...');
                await this.createEnvTemplate();
            }

            this.logger.info('Dependencies installed successfully');
            console.log(chalk.green(this.locale.get('messages.deps_installed')));
            return true;
        } catch (error) {
            this.logger.error('Failed to install dependencies', error);
            console.log(chalk.red(this.locale.get('errors.failed_to_install')));
            return false;
        }
    }

    async createEnvTemplate() {
        this.logger.info('Creating .env template file...');
        console.log(chalk.cyan('\n' + this.locale.get('prompts.create_env_template')));
        
        const template = `# Discord Bot Configuration
# ============================================
# 1. Get your Discord Bot Token:
#    - Go to https://discord.com/developers/applications
#    - Select your application
#    - Go to "Bot" section
#    - Click "Reset Token" or copy existing token
#
# 2. Get your Client ID:
#    - In same application, go to "General Information"
#    - Copy "Application ID"
#
# 3. Get your Guild (Server) ID:
#    - Enable Developer Mode in Discord (Settings > Advanced)
#    - Right-click your server > "Copy ID"

DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Optional: Add more environment variables as needed
# NODE_ENV=production
# LOG_LEVEL=info

# ============================================
# IMPORTANT:
# - Replace placeholder values with your actual data
# - Never commit this file to public repositories
# - Add .env to .gitignore`;

        fs.writeFileSync(this.envFile, template);
        
        const envPath = path.resolve(this.envFile);
        this.logger.info(`.env template created at: ${envPath}`);
        
        console.log(chalk.yellow('\n═══════════════════════════════════════════════════'));
        console.log(chalk.green(this.locale.get('messages.env_template_created')));
        console.log(chalk.yellow('═══════════════════════════════════════════════════'));
        console.log(chalk.blue('\n.env file created at:'));
        console.log(chalk.cyan(`  ${envPath}`));
        console.log(chalk.blue('\nPlease edit this file with:'));
        console.log(chalk.cyan('  1. Your Discord Bot Token'));
        console.log(chalk.cyan('  2. Your Client ID'));
        console.log(chalk.cyan('  3. Your Guild (Server) ID'));
        console.log(chalk.blue('\nYou can use any text editor:'));
        console.log(chalk.cyan('  Windows: Notepad, Notepad++, VS Code'));
        console.log(chalk.cyan('  macOS: TextEdit, VS Code'));
        console.log(chalk.cyan('  Linux: nano, vim, VS Code'));
        console.log(chalk.yellow('\n═══════════════════════════════════════════════════\n'));
    }

    async startBot() {
        this.logger.info(this.locale.get('menu.start_bot') + '...');
        console.log(chalk.cyan('\n' + this.locale.get('menu.start_bot') + '...'));

        if (!fs.existsSync('node_modules')) {
            this.logger.warn('Dependencies not installed. Installing...');
            console.log(chalk.yellow(this.locale.get('messages.deps_not_installed')));
            const installed = await this.installDependencies();
            if (!installed) {
                this.logger.error('Failed to install dependencies');
                console.log(chalk.red(this.locale.get('errors.failed_to_install')));
                return;
            }
        }

        if (!fs.existsSync(this.envFile)) {
            this.logger.warn('.env file not found. Creating template...');
            console.log(chalk.yellow(this.locale.get('messages.env_not_found')));
            await this.createEnvTemplate();
            console.log(chalk.red(this.locale.get('messages.env_not_configured')));
            return;
        }

        if (!await this.validateConfig()) {
            this.logger.error('Bot configuration is not valid');
            console.log(chalk.red(this.locale.get('messages.env_not_configured')));
            console.log(chalk.yellow('\n' + this.locale.get('prompts.edit_env_instructions')));
            console.log(chalk.blue(`Location: ${path.resolve(this.envFile)}`));
            return;
        }

        if (await this.checkBotProcess()) {
            this.logger.warn('Bot is already running');
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

            this.logger.info(`Bot started with PID: ${this.botProcess.pid}`);
            console.log(chalk.green(this.locale.formatString(
                this.locale.get('messages.bot_started'),
                this.botProcess.pid
            )));
            console.log(chalk.blue(this.locale.get('messages.use_stop_bot')));
            
        } catch (error) {
            this.logger.error('Failed to start bot', error);
            console.log(chalk.red(this.locale.formatString(
                this.locale.get('errors.failed_to_start'),
                error.message
            )));
        }
    }

    async stopBot() {
        this.logger.info(this.locale.get('menu.stop_bot') + '...');
        console.log(chalk.cyan('\n' + this.locale.get('menu.stop_bot') + '...'));

        if (!await this.checkBotProcess()) {
            this.logger.warn('Bot is not running');
            console.log(chalk.yellow(this.locale.get('messages.bot_not_running')));
            return;
        }

        try {
            const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
            this.logger.info(`Stopping bot with PID: ${pid}`);
            
            if (process.platform === 'win32') {
                execSync(`taskkill /pid ${pid} /f /t`);
            } else {
                process.kill(pid, 'SIGTERM');
            }
            
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            
            this.isBotRunning = false;
            this.logger.info('Bot stopped successfully');
            console.log(chalk.green(this.locale.get('messages.bot_stopped')));
            
        } catch (error) {
            this.logger.error('Failed to stop bot', error);
            console.log(chalk.red(this.locale.formatString(
                this.locale.get('errors.failed_to_stop'),
                error.message
            )));
            
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        }
    }

    async updateDependencies() {
        this.logger.info(this.locale.get('menu.update_deps') + '...');
        console.log(chalk.cyan('\n' + this.locale.get('menu.update_deps') + '...'));
        
        try {
            await this.runCommand('npm update --no-fund --no-audit', 'Updating packages...');
            this.logger.info('Dependencies updated successfully');
            console.log(chalk.green(this.locale.get('messages.deps_installed')));
        } catch (error) {
            this.logger.error('Failed to update dependencies', error);
            console.log(chalk.red(this.locale.get('errors.failed_to_update')));
        }
    }

    async showDetailedStatus() {
        console.clear();
        console.log(chalk.cyan.bold('\n' + this.locale.get('menu.system_status') + '\n'));

        this.logger.info('Displaying detailed system status');

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

        const plugins = this.pluginManager.getPluginList();
        console.log(chalk.cyan('\n' + this.locale.get('menu.plugins') + ':'));
        
        if (plugins.length === 0) {
            console.log(chalk.yellow(this.locale.get('messages.no_plugins')));
        } else {
            plugins.forEach((plugin, index) => {
                const status = plugin.enabled ? 
                    chalk.green(this.locale.get('bot_manager.enabled')) : 
                    chalk.red(this.locale.get('bot_manager.disabled'));
                
                console.log(chalk.white(`${index + 1}. ${plugin.name} [${status}]`));
                console.log(chalk.gray(`   ${plugin.description}`));
                console.log(chalk.gray(`   ${this.locale.get('bot_manager.version')}: ${plugin.version} | ${this.locale.get('bot_manager.author')}: ${plugin.author}`));
                console.log('');
            });
        }

        console.log(chalk.cyan(this.locale.get('bot_manager.plugins_directory') + ':'));
        console.log(chalk.blue(`  ${this.pluginManager.pluginsDir}`));

        const logStats = this.logger.getLogStats();
        console.log(chalk.cyan('\n' + this.locale.get('bot_manager.log_statistics') + ':'));
        console.log(chalk.blue(`${this.locale.get('bot_manager.log_file')}: ${logStats.path}`));
        console.log(chalk.blue(`${this.locale.get('bot_manager.log_size')}: ${(logStats.size / 1024).toFixed(2)} KB`));
        console.log(chalk.blue(`${this.locale.get('bot_manager.log_entries')}: ${logStats.lines}`));
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
        
        this.logger.info('User pressed Enter to continue');
        await this.showMainMenu();
    }

    exit() {
        this.logger.info(this.locale.get('bot_manager.shutting_down'));
        console.log(chalk.cyan('\n' + this.locale.get('bot_manager.shutting_down')));
        
        if (this.isBotRunning) {
            this.logger.warn('Stopping bot before exit...');
            console.log(chalk.yellow(this.locale.get('messages.stopping_bot_before_exit')));
            this.stopBot().then(() => {
                this.logger.system('BotManager shutdown complete');
                process.exit(0);
            });
        } else {
            this.logger.system('BotManager shutdown complete');
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