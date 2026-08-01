const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, Colors } = require('../utils/embedStyle');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список всех команд или информацию о конкретной команде')
    .addStringOption(option =>
      option.setName('cmd')
        .setDescription('Название команды для подробной информации')
        .setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    const commandName = interaction.options.getString('cmd');

    if (commandName) {
      const cmd = interaction.client.commands.get(commandName);
      if (!cmd || !cmd.data) {
        const embed = createEmbed({
          title: '❌ Ошибка',
          description: `Слеш-команда \`${commandName}\` не найдена.`,
          color: Colors.ERROR
        });
        return interaction.editReply({ embeds: [embed] });
      }

      const data = cmd.data;
      let description = `**Описание:** ${data.description || 'Нет описания'}`;

      const options = data.options || [];
      let usage = `/${data.name}`;
      if (options.length > 0) {
        usage += ' ' + options.map(opt => {
          const required = opt.required ? ' (обязательно)' : '';
          return `<${opt.name}${required}>`;
        }).join(' ');
      }
      description += `\n**Использование:** \`${usage}\``;

      const fields = options.length > 0 ? options.map(opt => ({
        name: `${opt.name}${opt.required ? ' *' : ''}`,
        value: opt.description || 'Нет описания',
        inline: false
      })) : [];

      const embed = createEmbed({
        title: `📖 Помощь по команде /${data.name}`,
        description,
        fields,
        color: Colors.INFO
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const slashCommands = interaction.client.commands;
    const slashFields = [];
    for (const [name, cmd] of slashCommands) {
      if (name === 'help') continue;
      slashFields.push({
        name: `/${name}`,
        value: cmd.data?.description || 'Нет описания',
        inline: false
      });
    }

    const slashEmbed = createEmbed({
      title: '📋 Список слеш-команд',
      description: 'Используйте `/help <команда>` для подробной информации.',
      fields: slashFields.length ? slashFields : [{ name: 'Нет команд', value: ' ' }],
      color: Colors.INFO
    });

    await interaction.editReply({ embeds: [slashEmbed] });

    if (config.allowedUsers.includes(interaction.user.id)) {
      const hiddenCommands = interaction.client.hiddenCommands;
      const hiddenFields = [];
      for (const [name, cmd] of hiddenCommands) {
        if (name === 'h') continue;
        hiddenFields.push({
          name: `!${name}`,
          value: cmd.description || 'Нет описания',
          inline: false
        });
      }

      let description = '⚠️ **Важно:** Если вы впервые будете использовать !-команды, напишите в ЛС боту что-нибудь. Бот может не отреагировать на команду без этого. В ЛС !-команды не видны боту. Для подробностей пишите !h\n\n';
      if (hiddenFields.length) {
        description += 'Список скрытых команд:';
      } else {
        description += 'Скрытых команд нет.';
      }

      const hiddenEmbed = createEmbed({
        title: '🔒 Скрытые команды (только для вас)',
        description,
        fields: hiddenFields.length ? hiddenFields : [{ name: 'Нет команд', value: ' ' }],
        color: Colors.WARNING
      });

      await interaction.followUp({ embeds: [hiddenEmbed], ephemeral: true });
    }
  }
};