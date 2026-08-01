const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'sendasbot',
  description: 'Отправить сообщение от имени бота в указанный канал',
  usage: '!sendasbot #канал текст_сообщения',
  example: '!sendasbot #общий Привет всем!',
  async execute(message, args, client) {
    if (!config.allowedUsers.includes(message.author.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channel) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Укажите канал.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const text = args.slice(1).join(' ');
    if (!text) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Укажите текст.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    try {
      await channel.send(text);
      const embed = createEmbed({ title: '✅ Отправлено', description: `Сообщение отправлено в ${channel}.`, color: Colors.SUCCESS });
      await message.author.send({ embeds: [embed] });
    } catch (err) {
      const embed = createEmbed({ title: '❌ Ошибка', description: err.message, color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
    }
    return null;
  }
};