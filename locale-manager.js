const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class LocaleManager {
    constructor() {
        this.localesDir = path.join(__dirname, 'locales');
        this.configFile = path.join(__dirname, 'language-config.json');
        this.defaultLanguage = 'en';
        this.currentLanguage = this.defaultLanguage;
        this.locales = {};
        this.availableLanguages = [];
        
        this.loadAvailableLanguages();
        this.loadConfig();
        this.loadLocale(this.currentLanguage);
    }

    loadAvailableLanguages() {
        try {
            if (!fs.existsSync(this.localesDir)) {
                fs.mkdirSync(this.localesDir, { recursive: true });
                console.log(chalk.yellow('Created locales directory'));
            }
            
            const files = fs.readdirSync(this.localesDir);
            this.availableLanguages = files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
            
            if (this.availableLanguages.length === 0) {
                this.createDefaultLocales();
                this.availableLanguages = ['en', 'ru'];
            }
            
            console.log(chalk.blue(`Available languages: ${this.availableLanguages.join(', ')}`));
        } catch (error) {
            console.log(chalk.red('Error loading available languages:'), error.message);
            this.availableLanguages = [this.defaultLanguage];
        }
    }

    createDefaultLocales() {
        const defaultEn = {
            "bot_manager": {
                "title": "Discord Bot Manager",
                "status": "System Status"
            }
        };
        
        const defaultRu = {
            "bot_manager": {
                "title": "Менеджер Discord бота",
                "status": "Статус системы"
            }
        };
        
        fs.writeFileSync(
            path.join(this.localesDir, 'en.json'),
            JSON.stringify(defaultEn, null, 2)
        );
        
        fs.writeFileSync(
            path.join(this.localesDir, 'ru.json'),
            JSON.stringify(defaultRu, null, 2)
        );
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.currentLanguage = config.language || this.defaultLanguage;
                
                if (!this.availableLanguages.includes(this.currentLanguage)) {
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
                lastUpdated: new Date().toISOString()
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
                    return this.loadLocale(this.defaultLanguage);
                }
                return false;
            }
            
            const localeData = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
            this.locales[languageCode] = localeData;
            this.currentLanguage = languageCode;
            
            return true;
        } catch (error) {
            console.log(chalk.red(`Error loading locale ${languageCode}:`), error.message);
            if (languageCode !== this.defaultLanguage) {
                return this.loadLocale(this.defaultLanguage);
            }
            return false;
        }
    }

    get(key, ...placeholders) {
        try {
            const keys = key.split('.');
            let value = this.locales[this.currentLanguage];
            
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
        if (this.availableLanguages.includes(languageCode)) {
            if (this.loadLocale(languageCode)) {
                this.currentLanguage = languageCode;
                this.saveConfig();
                return true;
            }
        }
        return false;
    }

    getLanguageList() {
        return this.availableLanguages.map(lang => ({
            name: lang.toUpperCase(),
            value: lang
        }));
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

module.exports = LocaleManager;