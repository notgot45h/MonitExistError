// Импорт необходимых модулей
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // Загрузка переменных из .env

// Создание экземпляра клиента
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Коллекция для хранения команд
client.commands = new Collection();

// === Динамическая загрузка команд из папки ===
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Добавляем команду в коллекцию, если у нее есть data и execute
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[ВНИМАНИЕ] Команда в ${filePath} отсутствует свойство "data" или "execute".`);
    }
  }
}

// === Обработчик событий для слеш-команд ===
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return; // Реагируем только на слеш-команды

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Команда ${interaction.commandName} не найдена.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Произошла ошибка при выполнении команды!', ephemeral: true });
  }
});

// Событие, которое сработает когда бот будет готов
client.once(Events.ClientReady, c => {
  console.log(`Готов! Бот ${c.user.tag} в сети.`);
});

// Запуск бота с использованием токена из .env
client.login(process.env.DISCORD_TOKEN);