const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'status',
  description: 'Установить статус бота',
  usage: '!status <тип> <текст>',
  example: '!status играет в Dota 2',
  async execute(message, args, client) {
    if (!config.allowedUsers.includes(message.author.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }

    const text = args.join(' ');
    if (!text) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Укажите статус. Пример: `!status играет в Dota 2`', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }

    try {
      await client.user.setActivity(text);
      const embed = createEmbed({ title: '✅ Статус обновлён', description: `Установлен: **${text}**`, color: Colors.SUCCESS });
      await message.author.send({ embeds: [embed] });
    } catch (err) {
      const embed = createEmbed({ title: '❌ Ошибка', description: err.message, color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
    }
    return null;
  }
};