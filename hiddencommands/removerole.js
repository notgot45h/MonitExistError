const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'removerole',
  description: 'Снять роль с участника',
  usage: '!removerole @участник @роль',
  example: '!removerole @User @Модератор',
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
    if (!member.roles.cache.has(role.id)) {
      const embed = createEmbed({ title: '⚠️ Предупреждение', description: `Роль отсутствует.`, color: Colors.WARNING });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    try {
      await member.roles.remove(role);
      const embed = createEmbed({ title: '✅ Роль снята', description: `Роль ${role.name} снята с ${member.user.tag}.`, color: Colors.SUCCESS });
      await message.author.send({ embeds: [embed] });
    } catch (err) {
      const embed = createEmbed({ title: '❌ Ошибка', description: err.message, color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
    }
    return null;
  }
};