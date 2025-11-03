const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class UpdateSystem {
    constructor(botManager) {
        this.botManager = botManager;
        this.configFile = path.join(__dirname, 'update-config.json');
        
        this.repository = 'https://github.com/notgot45h/MonitExistError.git';
        this.branch = 'Automatic-Update';
        
        this.defaultConfig = {
            autoUpdate: false,
            backupFolder: 'backups',
            lastUpdate: null
        };
        this.loadConfig();

    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                this.config = { ...this.defaultConfig, ...JSON.parse(fs.readFileSync(this.configFile, 'utf8')) };
            } else {
                this.config = this.defaultConfig;
                this.saveConfig();
            }
        } catch (error) {
            console.log(chalk.red('Ошибка загрузки конфигурации обновлений:'), error.message);
            this.config = this.defaultConfig;
        }
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.log(chalk.red('Ошибка сохранения конфигурации обновлений:'), error.message);
        }
    }

    async checkGit() {
        try {
            execSync('git --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    async checkRepository() {
        try {
            execSync('git status', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    async toggleAutoUpdate() {
        this.config.autoUpdate = !this.config.autoUpdate;
        this.saveConfig();
        
        const status = this.config.autoUpdate ? 'включены' : 'выключены';
        console.log(chalk.green(`Автообновления ${status}!`));
        
        if (this.config.autoUpdate) {
            console.log(chalk.blue(`Бот будет автоматически обновляться из репозитория: ${this.repository}`));
        }
    }

    async cleanupOldBackups(maxBackups = 5) {
        try {
            const backupsDir = path.join(__dirname, this.config.backupFolder);
            if (!fs.existsSync(backupsDir)) {
                return;
            }

            const backups = fs.readdirSync(backupsDir)
                .filter(file => file.startsWith('backup-'))
                .map(file => {
                    const filePath = path.join(backupsDir, file);
                    return {
                        name: file,
                        path: filePath,
                        time: fs.statSync(filePath).mtime.getTime()
                    };
                })
                .sort((a, b) => b.time - a.time);

            if (backups.length > maxBackups) {
                const toDelete = backups.slice(maxBackups);
                
                for (const backup of toDelete) {
                    fs.rmSync(backup.path, { recursive: true, force: true });
                    console.log(chalk.gray(`Удален старый бэкап: ${backup.name}`));
                }
                
                console.log(chalk.green(`Очищено ${toDelete.length} старых бэкапов. Оставлено: ${maxBackups}`));
            }
        } catch (error) {
            console.log(chalk.yellow('Не удалось очистить старые бэкапы:'), error.message);
        }
    }

    async getBackupsSize() {
        try {
            const backupsDir = path.join(__dirname, this.config.backupFolder);
            if (!fs.existsSync(backupsDir)) {
                return { count: 0, size: 0 };
            }

            let totalSize = 0;
            let count = 0;

            const backups = fs.readdirSync(backupsDir)
                .filter(file => file.startsWith('backup-'));

            for (const backup of backups) {
                const backupPath = path.join(backupsDir, backup);
                const size = this.getFolderSize(backupPath);
                totalSize += size;
                count++;
            }

            return { count, size: totalSize };
        } catch (error) {
            return { count: 0, size: 0 };
        }
    }

    getFolderSize(folderPath) {
        let size = 0;
        try {
            const items = fs.readdirSync(folderPath);
            for (const item of items) {
                const itemPath = path.join(folderPath, item);
                const stat = fs.statSync(itemPath);
                if (stat.isFile()) {
                    size += stat.size;
                } else if (stat.isDirectory()) {
                    size += this.getFolderSize(itemPath);
                }
            }
        } catch (error) {
        }
        return size;
    }

    async cleanupAllBackups() {
        try {
            const backupsDir = path.join(__dirname, this.config.backupFolder);
            if (!fs.existsSync(backupsDir)) {
                console.log(chalk.yellow('Папка бэкапов не существует!'));
                return 0;
            }

            const backups = fs.readdirSync(backupsDir)
                .filter(file => file.startsWith('backup-'));

            let deletedCount = 0;
            for (const backup of backups) {
                const backupPath = path.join(backupsDir, backup);
                fs.rmSync(backupPath, { recursive: true, force: true });
                console.log(chalk.gray(`Удален бэкап: ${backup}`));
                deletedCount++;
            }

            console.log(chalk.green(`Удалено всех бэкапов: ${deletedCount}`));
            return deletedCount;
        } catch (error) {
            console.log(chalk.red('Ошибка удаления бэкапов:'), error.message);
            return 0;
        }
    }

    async createBackup() {
        const backupDir = path.join(__dirname, this.config.backupFolder, `backup-${Date.now()}`);
        const filesToBackup = ['.env', 'update-config.json', 'bot.pid'];

        console.log(chalk.blue('Создание резервной копии...'));

        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            for (const file of filesToBackup) {
                if (fs.existsSync(file)) {
                    fs.copyFileSync(file, path.join(backupDir, file));
                }
            }

            if (fs.existsSync('package.json')) {
                fs.copyFileSync('package.json', path.join(backupDir, 'package.json'));
            }
            if (fs.existsSync('package-lock.json')) {
                fs.copyFileSync('package-lock.json', path.join(backupDir, 'package-lock.json'));
            }

            console.log(chalk.green(`Резервная копия создана: ${backupDir}`));
            
            await this.cleanupOldBackups(1);
            
            return backupDir;
        } catch (error) {
            console.log(chalk.red('Ошибка создания резервной копии:'), error.message);
            return null;
        }
    }

    async restoreBackup(backupDir) {
        console.log(chalk.blue('Восстановление из резервной копии...'));

        try {
            const files = fs.readdirSync(backupDir);
            for (const file of files) {
                const source = path.join(backupDir, file);
                const destination = path.join(__dirname, file);
                
                if (fs.existsSync(source)) {
                    fs.copyFileSync(source, destination);
                    console.log(chalk.green(`Восстановлен: ${file}`));
                }
            }
            return true;
        } catch (error) {
            console.log(chalk.red('Ошибка восстановления:'), error.message);
            return false;
        }
    }

    async checkForUpdates() {
    if (!await this.checkRepository()) {
        console.log(chalk.yellow('Папка не является Git репозиторием'));
        return false;
    }

    try {
        console.log(chalk.blue('Проверка обновлений...'));
        
        await this.runCommand('git fetch', 'Получение информации об обновлениях...');
        
        const status = execSync('git status -s --porcelain').toString();
        
        const ignoredFiles = ['update-config.json', '.env', 'bot.pid'];
        const relevantChanges = status.split('\n')
            .filter(line => line.trim())
            .filter(line => {
                const fileName = line.substring(3).trim();
                return !ignoredFiles.some(ignored => fileName.includes(ignored));
            });

        if (relevantChanges.length === 0) {
            console.log(chalk.green('Бот обновлен до последней версии!'));
            return false;
        } else {
            console.log(chalk.yellow('Доступно обновление!'));
            console.log(chalk.gray('Изменения:'));
            relevantChanges.forEach(change => console.log(chalk.gray(`  ${change}`)));
            return true;
        }
    } catch (error) {
        console.log(chalk.red('Ошибка проверки обновлений:'), error.message);
        return false;
    }
    }

    async runUpdate() {
        console.log(chalk.cyan('\nЗапуск процесса обновления...'));
        console.log(chalk.blue(`Репозиторий: ${this.repository}`));
        console.log(chalk.blue(`Ветка: ${this.branch}`));

        const tempBackupDir = path.join(__dirname, 'temp_update_backup');
        try {
            if (!fs.existsSync(tempBackupDir)) {
                fs.mkdirSync(tempBackupDir, { recursive: true });
            }
            const criticalFiles = ['bot-manager.js', 'package.json'];
            for (const file of criticalFiles) {
                if (fs.existsSync(file)) {
                    fs.copyFileSync(file, path.join(tempBackupDir, file));
                }
            }
            
        } catch (error) {
            console.log(chalk.yellow('Не удалось создать временный бэкап критических файлов'));
        }

        if (!await this.checkGit()) {
            console.log(chalk.red('Git не установлен на системе!'));
            console.log(chalk.yellow('Скачайте Git с: https://github.com/notgot45h/MonitExistError'));
            return false;
        }

        if (!await this.checkRepository()) {
            console.log(chalk.yellow('Папка не является Git репозиторием! Инициализируем...'));
            const success = await this.initRepository();
            if (!success) {
                console.log(chalk.red('Не удалось инициализировать репозиторий!'));
                return false;
            }
        }

        const backupDir = await this.createBackup();
        if (!backupDir) {
            console.log(chalk.red('Не удалось создать резервную копию! Прерывание обновления.'));
            return false;
        }

        const wasBotRunning = this.botManager.isBotRunning;

        try {
            if (wasBotRunning) {
                console.log(chalk.yellow('Останавливаем бота для обновления...'));
                await this.botManager.stopBot();
            }
            
            console.log(chalk.blue('Получение обновлений...'));
            await this.runCommand('git fetch origin', 'Загрузка изменений...');
            
            console.log(chalk.blue('Проверка изменений...'));
            const changes = await this.getUpdateChanges();
            console.log(chalk.blue(`Будут обновлены файлы: ${changes.files.length}`));

            await this.runCommand('git reset --hard origin/' + this.branch, 'Применение обновлений...');

            await this.runCommand('git clean -fd', 'Очистка старых файлов...');

            await this.restoreBackup(backupDir);

            console.log(chalk.blue('Установка обновленных зависимостей...'));
            await this.botManager.installDependencies();

            this.config.lastUpdate = new Date().toISOString();
            this.saveConfig();

            console.log(chalk.green('Обновление успешно завершено!'));

            try {
                if (fs.existsSync(tempBackupDir)) {
                    fs.rmSync(tempBackupDir, { recursive: true, force: true });
                }
            } catch (e) {
            }

            if (wasBotRunning) {
                console.log(chalk.yellow('Перезапуск бота...'));
                await this.botManager.startBot();
            }

            return true;

        } catch (error) {
            console.log(chalk.red('Ошибка во время обновления:'), error.message);
            
            try {
                console.log(chalk.yellow('Попытка восстановления из временного бэкапа...'));
                if (fs.existsSync(tempBackupDir)) {
                    const files = fs.readdirSync(tempBackupDir);
                    for (const file of files) {
                        const source = path.join(tempBackupDir, file);
                        const destination = path.join(__dirname, file);
                        if (fs.existsSync(source)) {
                            fs.copyFileSync(source, destination);
                            console.log(chalk.green(`Восстановлен: ${file}`));
                        }
                    }
                }
            } catch (restoreError) {
                console.log(chalk.red('Не удалось восстановить из временного бэкапа:'), restoreError.message);
            }
            
            console.log(chalk.yellow('Восстановление из резервной копии...'));
            await this.restoreBackup(backupDir);
            
            if (wasBotRunning) {
                console.log(chalk.yellow('Возобновление работы бота...'));
                await this.botManager.startBot();
            }
            
            return false;
        }
    }

    async getUpdateChanges() {
        try {
            const result = await this.runCommand('git diff --name-only HEAD..origin/' + this.branch, '', true);
            const files = result.stdout.split('\n').filter(line => line.trim() !== '');
            return { files };
        } catch (error) {
            return { files: [] };
        }
    }

    async initRepository() {
        try {
            console.log(chalk.blue('Инициализация Git репозитория...'));
            
            await this.runCommand('git init', 'Инициализация...');
            await this.runCommand(`git remote add origin ${this.repository}`, 'Добавление удаленного репозитория...');
            await this.runCommand('git fetch', 'Получение данных...');
            await this.runCommand(`git checkout -b ${this.branch}`, 'Создание ветки...');
            await this.runCommand(`git branch --set-upstream-to=origin/${this.branch} ${this.branch}`, 'Настройка отслеживания...');

            console.log(chalk.green('Репо успешно инициализирован!'));
            return true;
        } catch (error) {
            console.log(chalk.red('Ошибка инициализации репозитория:'), error.message);
            return false;
        }
    }

    async showUpdateStatus() {
        console.log(chalk.cyan('\nСтатус системы обновлений\n'));

        const gitStatus = await this.checkGit() ? chalk.green('Установлен') : chalk.red('Отсутствует');
        const repoStatus = await this.checkRepository() ? chalk.green('Настроен') : chalk.red('Не настроен');
        const autoUpdateStatus = this.config.autoUpdate ? chalk.green('Включена') : chalk.yellow('Выключена');
        const lastUpdate = this.config.lastUpdate ? 
            new Date(this.config.lastUpdate).toLocaleString() : chalk.yellow('Никогда');

        const backupsInfo = await this.getBackupsSize();
        const backupsStatus = backupsInfo.count > 0 ? 
            chalk.blue(`${backupsInfo.count} бэкапов (${(backupsInfo.size / 1024 / 1024).toFixed(2)} МБ)`) : 
            chalk.gray('Нет бэкапов');

        console.log(chalk.white('┌──────────────────────────'));
        console.log(chalk.white(`│ Git                       ${gitStatus}`));
        console.log(chalk.white(`│ Репозиторий               ${repoStatus}`));
        console.log(chalk.white(`│ Автообновления            ${autoUpdateStatus}`));
        console.log(chalk.white(`│ Последнее обновление      ${lastUpdate}`));
        console.log(chalk.white(`│ Ветка                     ${this.branch}`));
        console.log(chalk.white(`│ Бэкапы                    ${backupsStatus}`));
        console.log(chalk.white('└──────────────────────────'));

        console.log(chalk.blue(`\nРепозиторий: ${this.repository}`));

        if (await this.checkRepository()) {
            const hasUpdates = await this.checkForUpdates();
            if (hasUpdates) {
                console.log(chalk.yellow('\nДоступны обновления! Используйте "Обновить бота из Git"'));
            }
        }
    }

    runCommand(command, message = '', silent = false) {
        return new Promise((resolve, reject) => {
            if (message && !silent) console.log(chalk.blue(message));
            
            const child = require('child_process').exec(command, (error, stdout, stderr) => {
                if (error) {
                    if (!silent) {
                        if (!message.includes('Очистка')) {
                            console.log(chalk.red(`Ошибка: ${error.message}`));
                        }
                    }
                    reject(error);
                    return;
                }
                
                if (stdout && !silent && !stdout.includes('Already up to date')) {
                    console.log(chalk.gray(stdout));
                }
                if (stderr && !silent && !stderr.includes('warning:')) {
                    console.log(chalk.yellow(stderr));
                }
                
                resolve({ stdout, stderr });
            });
        });
    }
}

class BotManager {
    constructor() {
        this.isBotRunning = false;
        this.botProcess = null;
        this.pidFile = path.join(__dirname, 'bot.pid');
        this.envFile = path.join(__dirname, '.env');
        this.updateSystem = new UpdateSystem(this);
        
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
        console.log(chalk.blue('Discord Bot Manager - Автоматический режим\n'));
        
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
                case '--update-bot':
                    await this.updateSystem.runUpdate();
                    break;
                case '--check-updates':
                    await this.updateSystem.checkForUpdates();
                    break;
                case '--clean-backups':
                    await this.updateSystem.cleanupAllBackups();
                    break;
                case '--menu':
                    await this.showMainMenu();
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    break;
                default:
                    console.log(chalk.yellow(`Неизвестный аргумент: ${arg}`));
                    this.showHelp();
            }
        }
    }

    showHelp() {
        console.log(chalk.cyan(`
Discord Bot Manager - Справка по командам:

Основные команды:
  ${chalk.green('npm start')}              - Интерактивное меню
  ${chalk.green('node bot-manager.js --menu')}    - Интерактивное меню

Автоматические команды:
  ${chalk.green('--install, -i')}          - Установка зависимостей
  ${chalk.green('--setup, -s')}            - Настройка конфигурации
  ${chalk.green('--start')}                - Запуск бота
  ${chalk.green('--stop')}                 - Остановка бота
  ${chalk.green('--deploy-guild')}         - Деплой команд для гильдии
  ${chalk.green('--deploy-global')}        - Глобальный деплой команд
  ${chalk.green('--update')}               - Обновление зависимостей
  ${chalk.green('--reset')}                - Сброс конфигурации
  ${chalk.green('--status')}               - Детальный статус системы
  ${chalk.green('--update-bot')}           - Обновить бота из Git
  ${chalk.green('--check-updates')}        - Проверить обновления
  ${chalk.green('--clean-backups')}        - Очистить все бэкапы
  ${chalk.green('--help, -h')}             - Эта справка

Примеры:
  ${chalk.cyan('node bot-manager.js --install --setup --start')}
  ${chalk.cyan('npm start')}
        `));
        process.exit(0);
    }

    async showMainMenu() {
        console.clear();
        await this.checkSystemStatus();
        
        if (this.updateSystem.config.autoUpdate) {
            const hasUpdates = await this.updateSystem.checkForUpdates();
            if (hasUpdates) {
                console.log(chalk.yellow('\nДоступны обновления! Используйте "Обновить бота"'));
            }
        }
        
        const { action } = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: 'Выберите действие:',
            choices: [
                { name: 'Запустить бота', value: 'start' },
                { name: 'Остановить бота', value: 'stop' },
                new inquirer.Separator(),
                { name: 'Обновить бота из Git', value: 'update-bot' },
                { name: 'Включить/выключить автообновления', value: 'toggle-auto-update' },
                { name: 'Статус обновлений', value: 'update-status' },
                { name: 'Очистить все бэкапы', value: 'clean-backups' },
                new inquirer.Separator(),
                { name: 'Настроить бота', value: 'setup' },
                { name: 'Установить зависимости', value: 'install' },
                { name: 'Обновить зависимости', value: 'update' },
                { name: 'Сброс настроек', value: 'reset' },
                new inquirer.Separator(),
                { name: 'Деплой команд (гильдия)', value: 'deploy-guild' },
                { name: 'Деплой команд (глобально)', value: 'deploy-global' },
                new inquirer.Separator(),
                { name: 'Статус системы', value: 'status' },
                { name: 'Выход', value: 'exit' }
            ],
            pageSize: 19
        });

        await this.handleAction(action);
    }

    async checkSystemStatus() {
        this.isBotRunning = await this.checkBotProcess();
        const systemStatus = await this.getSystemStatus();
        
        console.log(chalk.blue('Текущий статус системы:'));
        console.log(chalk.white(`┌──────────────────`));
        console.log(chalk.white(`│ Бот               ${systemStatus.bot}`));
        console.log(chalk.white(`│ Зависимости       ${systemStatus.dependencies}`));
        console.log(chalk.white(`│ Конфигурация      ${systemStatus.config}`));
        console.log(chalk.white(`│ Node.js           ${systemStatus.node}`));
        console.log(chalk.white(`│ Git обновления    ${systemStatus.git}`));
        console.log(chalk.white(`└──────────────────\n`));
    }

    async getSystemStatus() {
        const botStatus = this.isBotRunning ? 
            chalk.green('Запущен') : chalk.red('Остановлен');
        
        const depsStatus = fs.existsSync('node_modules') ? 
            chalk.green('Установлены') : chalk.red('Отсутствуют');
        
        const configStatus = await this.validateConfig() ? 
            chalk.green('Настроено') : chalk.red('Не настроено');
        
        const nodeStatus = await this.checkNodeJS() ? 
            chalk.green('Найден версии: ' + process.version) : chalk.red('Не найден');

        const gitStatus = await this.updateSystem.checkGit() ? 
            chalk.green('Доступен') : chalk.yellow('Не установлен');

        return { 
            bot: botStatus, 
            dependencies: depsStatus, 
            config: configStatus, 
            node: nodeStatus,
            git: gitStatus
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
            case 'update-bot':
                await this.updateSystem.runUpdate();
                break;
            case 'toggle-auto-update':
                await this.updateSystem.toggleAutoUpdate();
                break;
            case 'update-status':
                await this.updateSystem.showUpdateStatus();
                break;
            case 'clean-backups':
                await this.updateSystem.cleanupAllBackups();
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

    async runCommand(command, message = 'Выполнение команды...') {
        return new Promise((resolve, reject) => {
            if (message) console.log(chalk.blue(`${message}`));
            
            const child = exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(chalk.red(`Ошибка: ${error.message}`));
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
        console.log(chalk.cyan('\nУстановка зависимостей...'));
        
        if (!await this.checkNodeJS()) {
            console.log(chalk.red('Node.js не установлен!'));
            console.log(chalk.yellow('Скачайте с: https://nodejs.org/'));
            return false;
        }

        if (!await this.checkNPM()) {
            console.log(chalk.red('npm не найден!'));
            console.log(chalk.yellow('Переустановите Node.js'));
            return false;
        }

        try {
            await this.runCommand('npm cache clean --force', 'Очистка кэша npm...');
            
            await this.runCommand('npm install --no-fund --no-audit', 'Установка зависимостей...');

            if (!fs.existsSync(this.envFile)) {
                await this.createDefaultEnv();
            }

            console.log(chalk.green('Зависимости успешно установлены!'));
            return true;
        } catch (error) {
            console.log(chalk.red('Ошибка установки зависимостей!'));
            return false;
        }
    }

    async createDefaultEnv() {
        const defaultEnv = `DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here`;

        fs.writeFileSync(this.envFile, defaultEnv);
        console.log(chalk.yellow('Создан файл .env с настройками по умолчанию'));
    }

    async setupConfiguration() {
    console.log(chalk.cyan('\nНастройка конфигурации бота...'));

    console.log(chalk.yellow('Внимание: Токен будет отображаться при вводе для проверки правильности.'));
    console.log(chalk.yellow('Убедитесь, что никто не видит ваш экран!\n'));

    const questions = [
        {
            type: 'input',
            name: 'token',
            message: 'Введите Discord Token бота:',
            validate: input => {
                if (!input) return 'Token не может быть пустым!';
                if (input.includes('your_bot_token_here')) return 'Замените ваш_bot_token_here на реальный токен!';
                return true;
            }
        },
        {
            type: 'input',
            name: 'clientId',
            message: 'Введите Client ID бота:',
            validate: input => {
                const cleanId = input.replace(/\D/g, '');
                return cleanId.length > 0 ? true : 'Client ID должен содержать цифры!';
            }
        },
        {
            type: 'input',
            name: 'guildId',
            message: 'Введите Server ID:',
            validate: input => {
                const cleanId = input.replace(/\D/g, '');
                return cleanId.length > 0 ? true : 'Server ID должен содержать цифры!';
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

    console.log(chalk.green('\nНастройки сохранены!'));
    console.log(chalk.blue(`Bot ID: ${cleanClientId}`));
    console.log(chalk.blue(`Server ID: ${cleanGuildId}`));
    console.log(chalk.green(`Token: ${answers.token.substring(0, 10)}...`));
    console.log(chalk.yellow('\nУбедитесь, что файл .env защищен и не попадает в публичные репозитории!'));
}

    async startBot() {
        console.log(chalk.cyan('\nЗапуск бота...'));

        if (!fs.existsSync('node_modules')) {
            console.log(chalk.yellow('Зависимости не установлены. Устанавливаю...'));
            const installed = await this.installDependencies();
            if (!installed) {
                console.log(chalk.red('Не удалось установить зависимости!'));
                return;
            }
        }

        if (!await this.validateConfig()) {
            console.log(chalk.yellow('Конфигурация не заполнена. Запускаю настройку...'));
            await this.setupConfiguration();
        }

        if (await this.checkBotProcess()) {
            console.log(chalk.yellow('Бот уже запущен!'));
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

            console.log(chalk.green(`Бот успешно запущен! (PID: ${this.botProcess.pid})`));
            console.log(chalk.blue('Для остановки используйте команду "Остановить бота"'));
            
        } catch (error) {
            console.log(chalk.red(`Ошибка запуска бота: ${error.message}`));
        }
    }

    async stopBot() {
        console.log(chalk.cyan('\nОстановка бота...'));

        if (!await this.checkBotProcess()) {
            console.log(chalk.yellow('Бот не запущен!'));
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
            console.log(chalk.green('Бот остановлен!'));
            
        } catch (error) {
            console.log(chalk.red(`Ошибка остановки бота: ${error.message}`));
            
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        }
    }

    async deployCommands(type) {
        console.log(chalk.cyan(`\nДеплой ${type === 'guild' ? 'гильдийских' : 'глобальных'} команд...`));

        if (!await this.validateConfig()) {
            console.log(chalk.red('Конфигурация не заполнена!'));
            console.log(chalk.yellow('Сначала настройте бота.'));
            return;
        }

        const scriptName = type === 'guild' ? 'deploy-commands-guild.js' : 'deploy-commands-global.js';
        const message = type === 'guild' ? 
            'Команды появятся мгновенно!' : 
            'Команды появятся в течение 24 часов';

        console.log(chalk.yellow(`${message}`));

        try {
            await this.runCommand(`node ${scriptName}`, 'Отправка команд Discord...');
            console.log(chalk.green(`${type === 'guild' ? 'Гильдийские' : 'Глобальные'} команды успешно отправлены!`));
        } catch (error) {
            console.log(chalk.red(`Ошибка деплоя команд: ${error.message}`));
        }
    }

    async updateDependencies() {
        console.log(chalk.cyan('\nОбновление зависимостей...'));
        
        try {
            await this.runCommand('npm update --no-fund --no-audit', 'Обновление пакетов...');
            console.log(chalk.green('Зависимости успешно обновлены!'));
        } catch (error) {
            console.log(chalk.red('Ошибка обновления зависимостей!'));
        }
    }

    async resetConfiguration() {
        console.log(chalk.cyan('\nСброс конфигурации...'));

        if (fs.existsSync(this.envFile)) {
            fs.unlinkSync(this.envFile);
            console.log(chalk.green('Файл .env удален!'));
        } else {
            console.log(chalk.yellow('Файл .env не найден.'));
        }

        const { createNew } = await inquirer.prompt({
            type: 'confirm',
            name: 'createNew',
            message: 'Создать новую конфигурацию?',
            default: true
        });

        if (createNew) {
            await this.setupConfiguration();
        } else {
            console.log(chalk.blue('Вы можете создать конфигурацию позже командой "Настроить бота"'));
        }
    }

    async showDetailedStatus() {
        console.clear();
        console.log(chalk.cyan.bold('\nДетальный статус системы\n'));

        const status = await this.getSystemStatus();
        
        console.log(chalk.white('┌──────────────────'));
        console.log(chalk.white(`│ Бот               ${status.bot}`));
        console.log(chalk.white(`│ Зависимости       ${status.dependencies}`));
        console.log(chalk.white(`│ Конфигурация      ${status.config}`));
        console.log(chalk.white(`│ Node.js           ${status.node}`));
        console.log(chalk.white(`│ Git обновления    ${status.git}`));
        console.log(chalk.white('└──────────────────'));

        console.log(chalk.cyan('\nДетали конфигурации:'));
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
                console.log(chalk.red('Не удалось прочитать .env файл'));
            }
        } else {
            console.log(chalk.red('Конфигурация не заполнена'));
        }

        await this.updateSystem.showUpdateStatus();

        console.log(chalk.cyan('\nДоступные команды:'));
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
            
            console.log(chalk.green(`Всего команд: ${totalCommands}`));
        } else {
            console.log(chalk.red('Папка commands не найдена'));
        }

        if (this.isBotRunning && fs.existsSync(this.pidFile)) {
            const pid = fs.readFileSync(this.pidFile, 'utf8');
            console.log(chalk.cyan('\nИнформация о процессе:'));
            console.log(chalk.blue(`PID: ${pid}`));
            console.log(chalk.blue(`Платформа: ${process.platform}`));
        }
    }

    async waitForEnter() {
        console.log(chalk.gray('\nНажмите Enter для продолжения...'));
        
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Нажмите Enter...'
            }
        ]);
        
        await this.showMainMenu();
    }

    exit() {
        console.log(chalk.cyan('\nЗавершение работы...'));
        
        if (this.isBotRunning) {
            console.log(chalk.yellow('Останавливаю бота перед выходом...'));
            this.stopBot().then(() => {
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
}

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nПринудительное завершение...'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\nЗавершение работы...'));
    process.exit(0);
});

new BotManager();