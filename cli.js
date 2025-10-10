const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BotCLI {
    constructor() {
        this.isRunning = false;
        this.botProcess = null;
        this.pidFile = path.join(__dirname, 'bot.pid');
        this.init();
    }

    init() {
        console.clear();
        this.showHeader();
        this.checkBotStatus();
        this.showMainMenu();
    }

    checkBotStatus() {
        try {
            if (fs.existsSync(this.pidFile)) {
                const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
                
                try {
                    if (process.platform === 'win32') {
                        execSync(`tasklist /fi "pid eq ${pid}" | findstr ${pid}`);
                    } else {
                        process.kill(pid, 0);
                    }
                    this.isRunning = true;
                    console.log(chalk.yellow('Обнаружен запущенный процесс бота!'));
                } catch (e) {
                    fs.unlinkSync(this.pidFile);
                    this.isRunning = false;
                }
            } else {
                this.isRunning = false;
            }
        } catch (error) {
            this.isRunning = false;
        }
    }

    showHeader() {
        console.log(chalk.blue.bold('=== Discord Bot CLI Controller ==='));
        console.log(chalk.gray('Управление ботом через командную строку'));
        console.log('');
    }

    getMenuChoices() {
        const choices = [];
        
        if (!this.isRunning) {
            choices.push({ 
                name: 'Запустить бота', 
                value: 'start'
            });
        } else {
            choices.push({ 
                name: 'Остановить бота', 
                value: 'stop'
            });
        }
        
        choices.push(
            { 
                name: 'Обновить команды (Гильдия) - быстро', 
                value: 'deploy-guild'
            },
            { 
                name: 'Обновить команды (Глобально) - до 24 часов', 
                value: 'deploy-global'
            },
            { 
                name: 'Показать статус', 
                value: 'status'
            },
            { 
                name: 'Выход', 
                value: 'exit'
            }
        );
        
        return choices;
    }

    showMainMenu() {
        console.clear();
        this.showHeader();
        
        this.checkBotStatus();
        
        const status = this.isRunning ? 
            chalk.green('Бот запущен') : 
            chalk.red('Бот остановлен');
        console.log(`Текущий статус: ${status}`);
        console.log('');

        inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Выберите действие:',
                choices: this.getMenuChoices(),
                pageSize: 10
            }
        ]).then(answers => {
            this.handleAction(answers.action);
        }).catch(error => {
            setTimeout(() => this.showMainMenu(), 1000);
        });
    }

    async handleAction(action) {
        switch(action) {
            case 'start':
                await this.startBot();
                break;
            case 'stop':
                await this.stopBot();
                break;
            case 'deploy-guild':
                await this.deployGuildCommands();
                break;
            case 'deploy-global':
                await this.deployGlobalCommands();
                break;
            case 'status':
                await this.showStatus();
                break;
            case 'exit':
                this.exit();
                break;
        }
    }

    async startBot() {
        if (this.isRunning) {
            console.log(chalk.yellow('Бот уже запущен!'));
            await this.waitForEnter();
            return;
        }

        console.log(chalk.green('Запускаю бота...'));
        
        try {
            this.botProcess = spawn('node', ['index.js'], {
                stdio: 'ignore',
                detached: true
            });

            fs.writeFileSync(this.pidFile, this.botProcess.pid.toString());
            
            this.botProcess.on('error', (error) => {
                console.log(chalk.red(`Ошибка запуска бота: ${error.message}`));
                this.isRunning = false;
                if (fs.existsSync(this.pidFile)) {
                    fs.unlinkSync(this.pidFile);
                }
            });

            this.botProcess.on('close', (code) => {
                this.isRunning = false;
                if (fs.existsSync(this.pidFile)) {
                    fs.unlinkSync(this.pidFile);
                }
            });

            this.isRunning = true;
            console.log(chalk.green('Бот успешно запущен! (PID: ' + this.botProcess.pid + ')'));
            
            this.botProcess.unref();
            
        } catch (error) {
            console.log(chalk.red(`Ошибка: ${error.message}`));
            this.isRunning = false;
        }

        await this.waitForEnter();
    }

    async stopBot() {
        this.checkBotStatus();
        
        if (!this.isRunning) {
            console.log(chalk.yellow('Бот не запущен!'));
            await this.waitForEnter();
            return;
        }

        console.log(chalk.yellow('Останавливаю бота...'));
        
        try {
            if (fs.existsSync(this.pidFile)) {
                const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
                
                if (process.platform === 'win32') {
                    execSync(`taskkill /pid ${pid} /f /t`);
                } else {
                    process.kill(pid, 'SIGTERM');
                }
                
                fs.unlinkSync(this.pidFile);
                console.log(chalk.green('Бот остановлен!'));
            } else {
                console.log(chalk.red('PID файл не найден. Бот может быть запущен вручную.'));
            }
        } catch (error) {
            console.log(chalk.red(`Ошибка остановки: ${error.message}`));
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        }

        this.isRunning = false;

        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.waitForEnter();
    }

    async deployGuildCommands() {
        console.log(chalk.blue('Обновляю слеш-команды для гильдии...'));
        console.log(chalk.yellow('Команды появятся мгновенно!'));
        
        return new Promise((resolve) => {
            const deployProcess = spawn('node', ['deploy-commands-guild.js'], {
                stdio: 'inherit'
            });

            deployProcess.on('close', (code) => {
                console.log('');
                if (code === 0) {
                    console.log(chalk.green('Команды для гильдии успешно обновлены!'));
                } else {
                    console.log(chalk.red('Ошибка при обновлении команд для гильдии.'));
                }
                
                setTimeout(() => {
                    resolve();
                    this.showMainMenu();
                }, 2000);
            });
        });
    }

    async deployGlobalCommands() {
        console.log(chalk.blue('Обновляю ГЛОБАЛЬНЫЕ слеш-команды...'));
        console.log(chalk.yellow('Команды появятся на всех серверах в течение 24 часов!'));
        
        return new Promise((resolve) => {
            const deployProcess = spawn('node', ['deploy-commands-global.js'], {
                stdio: 'inherit'
            });

            deployProcess.on('close', (code) => {
                console.log('');
                if (code === 0) {
                    console.log(chalk.green('Глобальные команды успешно отправлены на обновление!'));
                    console.log(chalk.blue('Команды появятся на всех серверах в течение 24 часов.'));
                } else {
                    console.log(chalk.red('Ошибка при глобальном обновлении команд.'));
                }
                
                setTimeout(() => {
                    resolve();
                    this.showMainMenu();
                }, 2000);
            });
        });
    }

    async showStatus() {
        console.clear();
        console.log(chalk.blue.bold('=== Статус системы ===\n'));
        
        this.checkBotStatus();
        
        const status = this.isRunning ? chalk.green('Запущен') : chalk.red('Остановлен');
        console.log(`Состояние бота: ${status}`);
        
        if (this.isRunning && fs.existsSync(this.pidFile)) {
            const pid = fs.readFileSync(this.pidFile, 'utf8');
            console.log(`PID процесса: ${pid}`);
        }
        
        console.log('\n' + chalk.blue.bold('Конфигурация:'));
        
        if (fs.existsSync('.env')) {
            console.log(chalk.green('Файл .env найден'));
            
            try {
                const envContent = fs.readFileSync('.env', 'utf8');
                const hasToken = envContent.includes('DISCORD_TOKEN') && !envContent.includes('your_bot_token_here');
                const hasClientId = envContent.includes('CLIENT_ID') && !envContent.includes('your_client_id_here');
                const hasGuildId = envContent.includes('GUILD_ID') && !envContent.includes('your_guild_id_here');
                
                console.log(hasToken ? 
                    chalk.green('Токен бота настроен') : 
                    chalk.red('Токен бота не настроен'));
                console.log(hasClientId ? 
                    chalk.green('CLIENT_ID настроен') : 
                    chalk.red('CLIENT_ID не настроен'));
                console.log(hasGuildId ? 
                    chalk.green('GUILD_ID настроен') : 
                    chalk.red('GUILD_ID не настроен'));
                    
            } catch (e) {
                console.log(chalk.yellow('Не удалось прочитать .env файл'));
            }
        } else {
            console.log(chalk.red('Файл .env не найден'));
        }

        console.log('\n' + chalk.blue.bold('Команды:'));
        if (fs.existsSync('commands')) {
            let totalCommands = 0;
            const commandFolders = fs.readdirSync('commands');
            
            commandFolders.forEach(folder => {
                const folderPath = path.join('commands', folder);
                if (fs.statSync(folderPath).isDirectory()) {
                    const commands = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                    totalCommands += commands.length;
                    console.log(chalk.blue(`${folder}: ${commands.length} команд`));
                }
            });
            
            console.log(chalk.blue(`Всего команд: ${totalCommands}`));
        } else {
            console.log(chalk.red('Папка commands не найдена'));
        }

        console.log(chalk.gray('\nНажмите Enter для возврата в меню...'));
        await this.waitForEnter();
    }

    async waitForEnter() {
        return inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Нажмите Enter чтобы продолжить...'
            }
        ]).then(() => {
            this.showMainMenu();
        });
    }

    exit() {
        console.log(chalk.blue('\nЗавершение работы...'));
        
        this.checkBotStatus();
        if (this.isRunning) {
            console.log(chalk.yellow('Останавливаю бота...'));
            try {
                if (fs.existsSync(this.pidFile)) {
                    const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
                    if (process.platform === 'win32') {
                        execSync(`taskkill /pid ${pid} /f /t`);
                    } else {
                        process.kill(pid, 'SIGTERM');
                    }
                    fs.unlinkSync(this.pidFile);
                }
            } catch (error) {
            }
        }
        
        process.exit(0);
    }
}

process.on('SIGINT', () => {
    console.log(chalk.yellow('\nЗавершение работы...'));
    process.exit(0);
});

new BotCLI();