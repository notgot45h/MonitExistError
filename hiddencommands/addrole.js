const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'addrole',
  description: 'Выдать роль участнику',
  usage: '!addrole @участник @роль',
  example: '!addrole @User @Модератор',
  async execute(message, args, client) {
    if (!config.allowedUsers.includes(message.author.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const member = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!member || !role) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Укажите участника и роль.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const botMember = message.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Роль выше бота.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    try {
      await member.roles.add(role);
      const embed = createEmbed({ title: '✅ Роль выдана', description: `Роль ${role.name} выдана ${member.user.tag}.`, color: Colors.SUCCESS });
      await message.author.send({ embeds: [embed] });
    } catch (err) {
      const embed = createEmbed({ title: '❌ Ошибка', description: err.message, color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
    }
    return null;
  }
};