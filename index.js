const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); 

const log = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Бот: ${message}`);
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      log(`[ВНИМАНИЕ] Команда в ${filePath} отсутствует свойство "data" или "execute".`);
    }
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Команда ${interaction.commandName} не найдена.`);
    return;
  }

  try {
    await command.execute(interaction);
    log(`Выполнена команда: ${interaction.commandName}`);
  } catch (error) {
    log(`Ошибка в команде ${interaction.commandName}: ${error.message}`);
    try {
      await interaction.reply({ content: 'Произошла ошибка при выполнении команды!', ephemeral: true });
    } catch (e) {
    }
  }
});

client.once(Events.ClientReady, c => {
  log(`Готов! Бот ${c.user.tag} в сети.`);
});

client.login(process.env.DISCORD_TOKEN);