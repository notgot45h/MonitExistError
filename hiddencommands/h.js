const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  name: 'h',
  description: 'Список скрытых команд или помощь по конкретной команде',
  async execute(message, args, client) {
    if (!config.allowedUsers.includes(message.author.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      await message.author.send({ embeds: [embed] });
      return null;
    }

    const commands = client.hiddenCommands;

    if (args.length > 0) {
      let cmdName = args[0].toLowerCase();
      if (cmdName.startsWith('!')) cmdName = cmdName.substring(1);
      const cmd = commands.get(cmdName);
      if (!cmd) {
        const embed = createEmbed({ title: '❌ Ошибка', description: `Скрытая команда \`${cmdName}\` не найдена.`, color: Colors.ERROR });
        await message.author.send({ embeds: [embed] });
        return null;
      }

      let description = `**Описание:** ${cmd.description || 'Нет описания'}`;
      if (cmd.usage) {
        description += `\n**Использование:** \`${cmd.usage}\``;
      } else {
        description += `\n**Использование:** \`!${cmdName} [аргументы]\``;
      }
      if (cmd.example) {
        description += `\n**Пример:** \`${cmd.example}\``;
      }

      const embed = createEmbed({
        title: `📖 Помощь по команде !${cmdName}`,
        description: description,
        color: Colors.INFO
      });
      await message.author.send({ embeds: [embed] });
      return null;
    }

    const fields = [];
    for (const [name, cmd] of commands) {
      if (name === 'h') continue;
      fields.push({
        name: `!${name}`,
        value: cmd.description || 'Нет описания',
        inline: false
      });
    }

    const embed = createEmbed({
      title: '📜 Скрытые команды',
      description: 'Используйте `!h <команда>` для подробной информации.',
      fields,
      color: Colors.INFO
    });
    await message.author.send({ embeds: [embed] });
    return null;
  }
};