const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const config = require('../config.json');
const { loadCommands } = require('./commandHandler');
const { loadHiddenCommands } = require('./hiddenCommandHandler');
const { syncGuilds, addGuildToFile, removeGuildFromFile } = require('./guildManager');
const { writePid, clearPid, checkPid } = require('./pidManager');
const logger = require('./logger');

let client = null;
let botRunning = false;
let startTime = null;
let commandCountToday = 0;

async function startBot() {
  if (botRunning) {
    logger.warn('Бот уже запущен');
    return;
  }
  if (!checkPid()) {
    logger.error('Бот уже запущен (PID файл существует)');
    return;
  }

  const newClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  newClient.commands = new Collection();
  newClient.hiddenCommands = loadHiddenCommands();

  const commands = loadCommands();
  for (const [name, command] of commands) {
    newClient.commands.set(name, command);
  }

  newClient.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = newClient.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
      commandCountToday++;
    } catch (error) {
      logger.error(`Ошибка команды: ${error.message}`);
    }
  });

  newClient.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild || !message.content.startsWith('!') || !config.allowedUsers.includes(message.author.id)) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const hiddenCmd = newClient.hiddenCommands.get(cmdName);
    if (!hiddenCmd) return;
    try {
      await hiddenCmd.execute(message, args, newClient);
      commandCountToday++;
    } catch (e) {}
    if (message.deletable) message.delete().catch(() => {});
  });

  newClient.on(Events.GuildCreate, g => addGuildToFile(g));
  newClient.on(Events.GuildDelete, g => removeGuildFromFile(g));

  newClient.once(Events.ClientReady, async () => {
    logger.info(`Бот ${newClient.user.tag} готов.`);
    syncGuilds(newClient);
    startTime = Date.now();
  });

  try {
    await newClient.login(config.token);
    client = newClient;
    botRunning = true;
    writePid(process.pid);
    logger.info('Бот запущен');
    startTime = Date.now();
    commandCountToday = 0;
  } catch (err) {
    logger.error(`Ошибка запуска бота: ${err.message}`);
    throw err;
  }
}

async function stopBot() {
  if (!botRunning || !client) {
    logger.warn('Бот не запущен');
    return;
  }
  try {
    await client.destroy();
  } catch (err) {
    logger.error(`Ошибка при остановке: ${err.message}`);
  } finally {
    client = null;
    botRunning = false;
    clearPid();
    startTime = null;
    logger.info('Бот остановлен');
  }
}

async function restartBot() {
  await stopBot();
  setTimeout(async () => {
    await startBot();
  }, 2000);
}

function isBotRunning() {
  return botRunning;
}

function getClient() {
  return client;
}

function getStats() {
  if (!botRunning || !client) {
    return {
      guilds: 0,
      users: 0,
      online: 0,
      ping: 0,
      uptime: 0,
      commandsToday: commandCountToday
    };
  }
  const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
  const onlineUsers = client.guilds.cache.reduce((acc, g) => acc + g.members.cache.filter(m => m.presence?.status !== 'offline').size, 0);
  const uptime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  return {
    guilds: client.guilds.cache.size,
    users: totalUsers,
    online: onlineUsers,
    ping: client.ws.ping,
    uptime: uptime,
    commandsToday: commandCountToday
  };
}

function getStartTime() {
  return startTime;
}

module.exports = {
  startBot,
  stopBot,
  restartBot,
  isBotRunning,
  getClient,
  getStats,
  getStartTime
};