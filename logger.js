const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logsDir, 'bot-manager.log');
        this.enabled = true;
        this.logToConsole = false; // По умолчанию не выводим логи в консоль
        this.logLevels = {
            INFO: 'INFO',
            WARN: 'WARN',
            ERROR: 'ERROR',
            DEBUG: 'DEBUG',
            SYSTEM: 'SYSTEM'
        };
        
        this.initialize();
    }

    initialize() {
        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
            
            if (!fs.existsSync(this.logFile)) {
                fs.writeFileSync(this.logFile, '');
            }
            
            this.log('SYSTEM', 'Logger initialized');
        } catch (error) {
            console.error(chalk.red('Failed to initialize logger:'), error.message);
            this.enabled = false;
        }
    }

    // Метод для включения/выключения вывода в консоль
    setConsoleOutput(enabled) {
        this.logToConsole = enabled;
    }

    getTimestamp() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];
        return `${date} ${time}`;
    }

    formatMessage(level, message) {
        const timestamp = this.getTimestamp();
        return `[${timestamp}] [${level}] ${message}`;
    }

    log(level, message) {
        if (!this.enabled) return;
        
        try {
            const logMessage = this.formatMessage(level, message);
            
            fs.appendFileSync(this.logFile, logMessage + '\n');
            
            // Выводим в консоль только если включено
            if (this.logToConsole) {
                this.consoleOutput(level, logMessage);
            }
        } catch (error) {
            // В случае ошибки записи в файл, выводим в консоль
            console.error(chalk.red('Failed to write log:'), error.message);
        }
    }

    consoleOutput(level, message) {
        const colors = {
            INFO: chalk.blue,
            WARN: chalk.yellow,
            ERROR: chalk.red,
            DEBUG: chalk.gray,
            SYSTEM: chalk.cyan
        };
        
        const color = colors[level] || chalk.white;
        console.log(color(message));
    }

    info(message) {
        this.log(this.logLevels.INFO, message);
    }

    warn(message) {
        this.log(this.logLevels.WARN, message);
    }

    error(message) {
        this.log(this.logLevels.ERROR, message);
    }

    debug(message) {
        this.log(this.logLevels.DEBUG, message);
    }

    system(message) {
        this.log(this.logLevels.SYSTEM, message);
    }

    logEvent(source, action, details = null) {
        const message = details ? 
            `${source}: ${action} - ${JSON.stringify(details)}` : 
            `${source}: ${action}`;
        this.info(message);
    }

    logCommand(command, args = []) {
        const argsStr = args.length > 0 ? ` ${args.join(' ')}` : '';
        this.system(`Executing command: ${command}${argsStr}`);
    }

    logInteraction(interactionType, details) {
        this.info(`Interaction: ${interactionType} - ${JSON.stringify(details)}`);
    }

    logError(source, error, context = null) {
        const errorDetails = {
            source,
            error: error.message,
            stack: error.stack,
            context
        };
        this.error(JSON.stringify(errorDetails, null, 2));
    }

    getLogStats() {
        try {
            if (!fs.existsSync(this.logFile)) {
                return { size: 0, lines: 0 };
            }
            
            const stats = fs.statSync(this.logFile);
            const content = fs.readFileSync(this.logFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim()).length;
            
            return {
                size: stats.size,
                lines: lines,
                path: this.logFile
            };
        } catch (error) {
            console.error(chalk.red('Failed to get log stats:'), error.message);
            return { size: 0, lines: 0, path: this.logFile };
        }
    }

    clearLogs() {
        try {
            fs.writeFileSync(this.logFile, '');
            this.system('Logs cleared');
            return true;
        } catch (error) {
            this.error(`Failed to clear logs: ${error.message}`);
            return false;
        }
    }

    getRecentLogs(lines = 50) {
        try {
            if (!fs.existsSync(this.logFile)) {
                return [];
            }
            
            const content = fs.readFileSync(this.logFile, 'utf8');
            const allLines = content.split('\n').filter(line => line.trim());
            return allLines.slice(-lines);
        } catch (error) {
            console.error(chalk.red('Failed to read logs:'), error.message);
            return [];
        }
    }
}

module.exports = Logger;