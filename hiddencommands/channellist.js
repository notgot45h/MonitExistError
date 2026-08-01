const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'channellist',
  description: 'Показать список текстовых каналов текущего сервера',
  usage: '!channellist',
  example: '!channellist',
  async execute(message, args, client) {
    if (!config.allowedUsers.includes(message.author.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const textChannels = message.guild.channels.cache
      .filter(c => c.type === 0)
      .sort((a, b) => a.position - b.position)
      .map(c => `#${c.name} (ID: ${c.id})`);
    const embed = createEmbed({
      title: `📋 Каналы сервера ${message.guild.name}`,
      description: textChannels.length > 0 ? textChannels.slice(0, 40).join('\n') : 'Каналы отсутствуют.',
      color: Colors.INFO
    });
    await message.author.send({ embeds: [embed] });
    return null;
  }
};