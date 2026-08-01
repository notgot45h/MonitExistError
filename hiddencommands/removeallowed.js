const config = require('../config.json');
const { removeAllowedUser } = require('../utils/configManager');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'removeallowed',
  description: 'Удалить пользователя из allowedUsers (только superAdmins)',
  usage: '!removeallowed <ID пользователя> [notify]',
  example: '!removeallowed 123456789012345678 notify',
  async execute(message, args, client) {
    if (!config.superAdmins.includes(message.author.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Укажите корректный ID.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }
    const shouldNotify = args[1]?.toLowerCase() === 'notify';
    const removed = removeAllowedUser(userId);
    if (removed) {
      const embed = createEmbed({ title: '✅ Успех', description: `Пользователь ${userId} удален.`, color: Colors.SUCCESS });
      await message.author.send({ embeds: [embed] });
      if (shouldNotify) {
        try {
          const user = await client.users.fetch(userId);
          const n = createEmbed({ title: '📉 Доступ понижен', description: 'Вы удалены из allowedUsers.', color: Colors.WARNING });
          await user.send({ embeds: [n] });
        } catch (e) {}
      }
    } else {
      const embed = createEmbed({ title: '⚠️ Предупреждение', description: `Пользователь не найден.`, color: Colors.WARNING });
      await message.author.send({ embeds: [embed] });
    }
    return null;
  }
};