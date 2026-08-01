const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Выйти из текущего голосового канала'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const connection = getVoiceConnection(interaction.guildId);
    if (!connection) {
      const embed = createEmbed({
        title: '❌ Ошибка',
        description: 'Я не нахожусь в голосовом канале.',
        color: Colors.ERROR
      });
      return interaction.editReply({ embeds: [embed] });
    }

    try {
      connection.destroy();
      const embed = createEmbed({
        title: '✅ Отключено',
        description: `Вышел из голосового канала.`,
        color: Colors.SUCCESS
      });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const embed = createEmbed({
        title: '❌ Ошибка',
        description: `Не удалось отключиться: ${error.message}`,
        color: Colors.ERROR
      });
      await interaction.editReply({ embeds: [embed] });
    }
  }
};