const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class BotCLI {
    constructor() {
        this.isRunning = false;
        this.botProcess = null;
        this.init();
    }

    init() {
        console.clear();
        this.showHeader();
        this.showMainMenu();
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
                name: 'Обновить команды Discord', 
                value: 'deploy'
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
            console.log(chalk.yellow('Произошла ошибка, возвращаюсь в меню...'));
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
            case 'deploy':
                await this.deployCommands();
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

        this.botProcess = spawn('node', ['index.js'], {
            stdio: 'ignore',
            detached: true 
        });

        this.botProcess.unref();

        this.botProcess.on('error', (error) => {
            console.log(chalk.red(`Ошибка запуска бота: ${error.message}`));
            this.isRunning = false;
            this.showMainMenu();
        });

        setTimeout(() => {
            this.isRunning = true;
            console.log(chalk.green('Бот успешно запущен!'));
            console.log(chalk.gray('Бот работает в фоновом режиме.'));
            this.showMainMenu();
        }, 2000);
    }

    async stopBot() {
        if (!this.isRunning) {
            console.log(chalk.yellow('Бот не запущен!'));
            await this.waitForEnter();
            return;
        }

        console.log(chalk.yellow('Останавливаю бота...'));
        
        if (this.botProcess) {
            try {
                process.kill(this.botProcess.pid);
            } catch (e) {
            }
        }
        
        this.isRunning = false;
        this.botProcess = null;
        console.log(chalk.green('Бот остановлен!'));
        
        setTimeout(() => {
            this.showMainMenu();
        }, 1000);
    }

    async deployCommands() {
        console.log(chalk.blue('Обновляю слеш-команды...'));
        
        return new Promise((resolve) => {
            const deployProcess = spawn('node', ['deploy-commands.js'], {
                stdio: 'inherit'
            });

            deployProcess.on('close', (code) => {
                console.log(''); 
                if (code === 0) {
                    console.log(chalk.green('Команды успешно обновлены!'));
                } else {
                    console.log(chalk.red('Ошибка при обновлении команд.'));
                }
                
                setTimeout(() => {
                    this.showMainMenu();
                }, 2000);
            });
        });
    }

    async showStatus() {
        console.clear();
        console.log(chalk.blue.bold('=== Статус системы ===\n'));
        
        const status = this.isRunning ? chalk.green('Запущен') : chalk.red('Остановлен');
        console.log(`Состояние бота: ${status}`);
        
        console.log('\n' + chalk.blue.bold('Конфигурация:'));
        
        if (fs.existsSync('.env')) {
            console.log(chalk.green('[OK] Файл .env найден'));
            
            try {
                const envContent = fs.readFileSync('.env', 'utf8');
                const hasToken = envContent.includes('DISCORD_TOKEN');
                const hasClientId = envContent.includes('CLIENT_ID');
                const hasGuildId = envContent.includes('GUILD_ID');
                
                console.log(hasToken ? 
                    chalk.green('[OK] Токен бота настроен') : 
                    chalk.red('[ERROR] Токен бота не найден'));
                console.log(hasClientId ? 
                    chalk.green('[OK] CLIENT_ID настроен') : 
                    chalk.red('[ERROR] CLIENT_ID не найден'));
                console.log(hasGuildId ? 
                    chalk.green('[OK] GUILD_ID настроен') : 
                    chalk.red('[ERROR] GUILD_ID не найден'));
                    
            } catch (e) {
                console.log(chalk.yellow('[WARN] Не удалось прочитать .env файл'));
            }
        } else {
            console.log(chalk.red('[ERROR] Файл .env не найден'));
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
                    console.log(chalk.blue(`  ${folder}: ${commands.length} команд`));
                }
            });
            
            console.log(chalk.blue(`Всего команд: ${totalCommands}`));
        } else {
            console.log(chalk.red('[ERROR] Папка commands не найдена'));
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
        if (this.isRunning && this.botProcess) {
            console.log(chalk.yellow('Останавливаю бота...'));
            try {
                process.kill(this.botProcess.pid);
            } catch (e) {
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