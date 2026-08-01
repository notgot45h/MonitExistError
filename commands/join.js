const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Подключиться к вашему голосовому каналу'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const member = interaction.member;
    const channel = member.voice.channel;
    if (!channel) {
      const embed = createEmbed({
        title: '❌ Ошибка',
        description: 'Вы не находитесь в голосовом канале.',
        color: Colors.ERROR
      });
      return interaction.editReply({ embeds: [embed] });
    }

    const existingConnection = getVoiceConnection(interaction.guildId);
    if (existingConnection && existingConnection.joinConfig.channelId === channel.id) {
      const embed = createEmbed({
        title: 'ℹ️ Уже подключён',
        description: `Я уже нахожусь в канале ${channel.name}.`,
        color: Colors.INFO
      });
      return interaction.editReply({ embeds: [embed] });
    }

    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });
      const embed = createEmbed({
        title: '✅ Подключено',
        description: `Подключился к каналу ${channel.name}.`,
        color: Colors.SUCCESS
      });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const embed = createEmbed({
        title: '❌ Ошибка',
        description: `Не удалось подключиться: ${error.message}`,
        color: Colors.ERROR
      });
      await interaction.editReply({ embeds: [embed] });
    }
  }
};