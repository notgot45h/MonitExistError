const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, Colors } = require('../utils/embedStyle');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Удалить сообщение по ID (только для разрешённых пользователей)')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID сообщения для удаления')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('delay')
        .setDescription('Через сколько секунд удалить статусное сообщение (0 = не удалять)')
        .setRequired(false)
        .setMinValue(0)),
  async execute(interaction) {
    if (!config.allowedUsers.includes(interaction.user.id)) {
      const embed = createEmbed({
        title: '❌ Доступ запрещён',
        description: 'У вас нет прав на использование этой команды.',
        color: Colors.ERROR
      });
      return interaction.reply({ embeds: [embed] });
    }

    const messageId = interaction.options.getString('message_id');
    const delay = interaction.options.getInteger('delay') || 0;

    await interaction.deferReply({ ephemeral: false });

    try {
      const message = await interaction.channel.messages.fetch(messageId);
      if (!message) {
        const embed = createEmbed({
          title: '❌ Ошибка',
          description: `Сообщение с ID \`${messageId}\` не найдено в этом канале.`,
          color: Colors.ERROR
        });
        return interaction.editReply({ embeds: [embed] });
      }

      await message.delete();

      const embed = createEmbed({
        title: '✅ Сообщение удалено',
        description: `Сообщение \`${messageId}\` успешно удалено.`,
        color: Colors.SUCCESS
      });
      const reply = await interaction.editReply({ embeds: [embed] });

      if (delay > 0) {
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, delay * 1000);
      }
    } catch (error) {
      const embed = createEmbed({
        title: '❌ Ошибка',
        description: `Не удалось удалить сообщение: ${error.message}`,
        color: Colors.ERROR
      });
      await interaction.editReply({ embeds: [embed] });
    }
  }
};