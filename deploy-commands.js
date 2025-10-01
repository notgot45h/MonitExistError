const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config(); // ЭТА СТРОКА ОБЯЗАТЕЛЬНА!


const commands = [];
// Формируем путь к папке с командами
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Проходим по всем папкам и файлам в директории commands
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Если у команды есть свойства data и execute, добавляем её
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[ПРЕДУПРЕЖДЕНИЕ] Команда в ${filePath} не имеет необходимых свойств "data" или "execute".`);
    }
  }
}

// Создаем экземпляр REST модуля
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Запускаем процесс развёртывания
(async () => {
  try {
    console.log(`Начинается обновление ${commands.length} слеш-команд.`);

    // Выберите один из двух вариантов ниже, закомментировав другой
   
    // ВАРИАНТ 1: Регистрация команд для конкретного сервера (быстрое обновление)
    // const data = await rest.put(
    //   Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    //   { body: commands },
    // );
   
    // ВАРИАНТ 2: Глобальная регистрация команд (обновление до 1 часа)
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`Успешно перезагружено ${data.length} слеш-команд.`);
  } catch (error) {
    console.error('Ошибка при регистрации команд:', error);
  }
})();