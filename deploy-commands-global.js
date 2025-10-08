const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[ПРЕДУПРЕЖДЕНИЕ] Команда в ${filePath} не имеет необходимых свойств "data" или "execute".`);
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Начинается ГЛОБАЛЬНОЕ обновление ${commands.length} слеш-команд.`);
    console.log('Глобальные команды обновляются до 24 часов!');

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`Успешно перезагружено ${data.length} ГЛОБАЛЬНЫХ слеш-команд.`);
    console.log('Команды появятся на всех серверах в течение 24 часов.');
  } catch (error) {
    console.error('Ошибка при глобальной регистрации команд:', error);
  }
})();