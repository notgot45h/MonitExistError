const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = new Map();

function loadCommands() {
  commands.clear();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    }
  }
  return commands;
}

function loadSingleCommand(fileName) {
  const filePath = path.join(__dirname, '..', 'commands', `${fileName}.js`);
  if (!fs.existsSync(filePath)) throw new Error(`Файл ${fileName}.js не найден`);
  delete require.cache[require.resolve(filePath)];
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.set(command.data.name, command);
    return command;
  }
  throw new Error('Некорректная структура команды');
}

function unloadCommand(commandName) {
  if (commands.has(commandName)) {
    commands.delete(commandName);
    return true;
  }
  return false;
}

function getAllCommandFiles() {
  const commandsPath = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(commandsPath)) return [];
  return fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace(/\.js$/, ''));
}

function isCommandLoaded(commandName) {
  return commands.has(commandName);
}

async function registerGlobally(token, clientId, timeout = 15000) {
  const rest = new REST({ version: '10', timeout: timeout }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: [] });
  const body = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
  await rest.put(Routes.applicationCommands(clientId), { body });
}

async function registerForGuild(token, clientId, guildId, timeout = 15000) {
  const rest = new REST({ version: '10', timeout: timeout }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
  const body = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
}

async function deleteGlobalCommand(token, clientId, commandName, timeout = 15000) {
  const rest = new REST({ version: '10', timeout: timeout }).setToken(token);
  const registeredCommands = await rest.get(Routes.applicationCommands(clientId));
  const target = registeredCommands.find(cmd => cmd.name === commandName);
  if (target) {
    await rest.delete(Routes.applicationCommand(clientId, target.id));
  }
}

async function deleteGuildCommand(token, clientId, guildId, commandName, timeout = 15000) {
  const rest = new REST({ version: '10', timeout: timeout }).setToken(token);
  const registeredCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
  const target = registeredCommands.find(cmd => cmd.name === commandName);
  if (target) {
    await rest.delete(Routes.applicationGuildCommand(clientId, guildId, target.id));
  }
}

function getCommands() {
  return commands;
}

module.exports = {
  loadCommands,
  loadSingleCommand,
  unloadCommand,
  getAllCommandFiles,
  isCommandLoaded,
  registerGlobally,
  registerForGuild,
  deleteGlobalCommand,
  deleteGuildCommand,
  getCommands
};