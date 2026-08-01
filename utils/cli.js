const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const {
  loadCommands,
  registerGlobally,
  registerForGuild,
  getCommands,
  getAllCommandFiles,
  isCommandLoaded
} = require('./commandHandler');
const config = require('../config.json');
const logger = require('./logger');

let client;
let restartBotFn;
let rl;

function setClient(c) { client = c; }
function setRestartFn(fn) { restartBotFn = fn; }

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer));
  });
}

async function askNumber(prompt, min, max) {
  while (true) {
    const input = await question(prompt);
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      return num;
    }
    console.log(chalk.red(`Введите число от ${min} до ${max}.`));
  }
}

async function pause() {
  await question('Нажмите Enter для продолжения...');
}

async function showMainMenu() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    console.clear();
    console.log(chalk.bold.blue('=== Панель управления ботом ===\n'));
    console.log('1. Статистика серверов');
    console.log('2. Отправить сообщение на сервер');
    console.log('3. Отправить сообщение на все сервера');
    console.log('4. Управление командами');
    console.log('5. Обновить глобальные команды');
    console.log('6. Обновить команды гильдии');
    console.log('7. Перезагрузить бота');
    console.log('8. Остановить бота');
    console.log('0. Выход\n');

    const choice = await askNumber('Выберите действие (0-8): ', 0, 8);

    try {
      switch (choice) {
        case 1:
          await showGuildStats();
          break;
        case 2:
          await sendToServer();
          break;
        case 3:
          await sendToAllServers();
          break;
        case 4:
          await manageCommands();
          break;
        case 5:
          await registerGlobally(config.token, config.clientId, 20000);
          console.log(chalk.green('Глобальные команды обновлены.'));
          await pause();
          break;
        case 6:
          await updateGuildCommands();
          break;
        case 7:
          await restartBotFn();
          rl.close();
          return;
        case 8:
          await stopBot();
          rl.close();
          return;
        case 0:
          console.log('Выход...');
          rl.close();
          process.exit(0);
      }
    } catch (err) {
      console.error(chalk.red('Ошибка: ' + err.message));
      await pause();
    }
  }
}

async function showGuildStats() {
  if (!client || !client.isReady()) {
    console.log(chalk.yellow('Бот не запущен.'));
    await pause();
    return;
  }
  const guilds = client.guilds.cache.map(g => ({ id: g.id, name: g.name }));
  if (guilds.length === 0) {
    console.log(chalk.yellow('Серверов не найдено.'));
    await pause();
    return;
  }

  while (true) {
    console.clear();
    console.log(chalk.bold('Список серверов:\n'));
    guilds.forEach((g, idx) => {
      console.log(`${idx + 1}. ${g.name} (ID: ${g.id})`);
    });
    console.log('0. Назад\n');

    const choice = await askNumber('Выберите сервер (0-' + guilds.length + '): ', 0, guilds.length);
    if (choice === 0) return;
    const selected = guilds[choice - 1];
    await guildSubMenu(selected.id);
  }
}

async function guildSubMenu(guildId) {
  const guild = client.guilds.cache.get(guildId);
  while (true) {
    console.clear();
    console.log(chalk.bold(`Сервер: ${guild.name}\n`));
    console.log('1. Информация о сервере');
    console.log('2. Список ролей');
    console.log('0. Назад\n');

    const choice = await askNumber('Выберите действие (0-2): ', 0, 2);
    if (choice === 0) return;
    if (choice === 1) await showGuildInfo(guild);
    if (choice === 2) await showRolesList(guild);
  }
}

async function showGuildInfo(guild) {
  const owner = await guild.fetchOwner();
  console.log(chalk.white('Название: ') + chalk.bold(guild.name));
  console.log(chalk.white('ID: ') + chalk.bold(guild.id));
  console.log(chalk.white('Владелец: ') + chalk.bold(owner.user.tag));
  console.log(chalk.white('Участников: ') + chalk.bold(guild.memberCount));
  console.log(chalk.white('Каналов: ') + chalk.bold(guild.channels.cache.size));
  await pause();
}

async function showRolesList(guild) {
  const roles = guild.roles.cache.filter(r => r.name !== '@everyone').map(r => ({ name: r.name, id: r.id }));
  if (roles.length === 0) {
    console.log(chalk.yellow('Ролей не найдено.'));
  } else {
    console.table(roles);
  }
  await pause();
}

async function sendToServer() {
  if (!client || !client.isReady()) {
    console.log(chalk.yellow('Бот не запущен.'));
    await pause();
    return;
  }
  const guilds = client.guilds.cache.map(g => ({ id: g.id, name: g.name }));
  if (guilds.length === 0) {
    console.log(chalk.yellow('Нет серверов.'));
    await pause();
    return;
  }

  while (true) {
    console.clear();
    console.log(chalk.bold('Выберите сервер:\n'));
    guilds.forEach((g, idx) => {
      console.log(`${idx + 1}. ${g.name} (${g.id})`);
    });
    console.log('0. Назад\n');

    const choice = await askNumber('Выберите сервер (0-' + guilds.length + '): ', 0, guilds.length);
    if (choice === 0) return;
    const guild = client.guilds.cache.get(guilds[choice - 1].id);
    const channels = guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: '#' + c.name }));
    if (channels.length === 0) {
      console.log(chalk.yellow('Нет текстовых каналов.'));
      await pause();
      return;
    }

    while (true) {
      console.clear();
      console.log(chalk.bold(`Каналы сервера ${guild.name}:\n`));
      channels.forEach((ch, idx) => {
        console.log(`${idx + 1}. ${ch.name}`);
      });
      console.log('0. Назад\n');

      const chChoice = await askNumber('Выберите канал (0-' + channels.length + '): ', 0, channels.length);
      if (chChoice === 0) break;
      const channel = guild.channels.cache.get(channels[chChoice - 1].id);
      const text = await question('Введите текст сообщения: ');
      try {
        await channel.send(text);
        console.log(chalk.green('Сообщение отправлено.'));
      } catch (err) {
        console.log(chalk.red('Ошибка: ' + err.message));
      }
      await pause();
      return;
    }
  }
}

async function sendToAllServers() {
  if (!client || !client.isReady()) {
    console.log(chalk.yellow('Бот не запущен.'));
    await pause();
    return;
  }
  const text = await question('Введите текст сообщения: ');
  let count = 0;
  for (const guild of client.guilds.cache.values()) {
    const ch = guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));
    if (ch) {
      try {
        await ch.send(text);
        count++;
      } catch (e) {}
    }
  }
  console.log(chalk.green(`Отправлено на ${count} серверов.`));
  await pause();
}

async function manageCommands() {
  while (true) {
    console.clear();
    console.log(chalk.bold('Управление командами:\n'));
    console.log('1. Статус команд');
    console.log('0. Назад\n');

    const choice = await askNumber('Выберите действие (0-1): ', 0, 1);
    if (choice === 0) return;
    if (choice === 1) await showCommandsStatus();
  }
}

async function showCommandsStatus() {
  const files = getAllCommandFiles();
  const status = files.map(f => ({
    'Файл': f,
    'Загружена': isCommandLoaded(f) ? 'Да' : 'Нет'
  }));
  console.table(status);
  await pause();
}

async function updateGuildCommands() {
  if (!client || !client.isReady()) {
    console.log(chalk.yellow('Бот не запущен.'));
    await pause();
    return;
  }
  const guilds = client.guilds.cache.map(g => ({ id: g.id, name: g.name }));
  if (guilds.length === 0) {
    console.log(chalk.yellow('Нет серверов.'));
    await pause();
    return;
  }

  while (true) {
    console.clear();
    console.log(chalk.bold('Выберите гильдию для обновления команд:\n'));
    guilds.forEach((g, idx) => {
      console.log(`${idx + 1}. ${g.name} (${g.id})`);
    });
    console.log(`${guilds.length + 1}. Все гильдии`);
    console.log('0. Назад\n');

    const choice = await askNumber(`Выберите гильдию (0-${guilds.length + 1}): `, 0, guilds.length + 1);
    if (choice === 0) return;

    loadCommands();

    if (choice === guilds.length + 1) {
      console.log(chalk.yellow('Обновление команд на всех гильдиях...'));
      let successCount = 0;
      for (const g of guilds) {
        try {
          await registerForGuild(config.token, config.clientId, g.id, 20000);
          successCount++;
          console.log(chalk.green(`Команды обновлены для ${g.name} (${g.id})`));
        } catch (err) {
          console.log(chalk.red(`Ошибка для ${g.name}: ${err.message}`));
        }
      }
      console.log(chalk.green(`Обновление завершено. Успешно: ${successCount} из ${guilds.length}`));
      await pause();
      return;
    } else {
      const gid = guilds[choice - 1].id;
      try {
        await registerForGuild(config.token, config.clientId, gid, 20000);
        console.log(chalk.green(`Команды гильдии ${guilds[choice - 1].name} обновлены.`));
      } catch (err) {
        console.log(chalk.red(`Ошибка: ${err.message}`));
      }
      await pause();
      return;
    }
  }
}

async function stopBot() {
  console.log(chalk.yellow('Остановка бота...'));
  if (client) await client.destroy().catch(() => {});
  process.exit(0);
}

module.exports = { showMainMenu, setClient, setRestartFn };