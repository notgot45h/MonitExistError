const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, Colors } = require('../utils/embedStyle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Проверить задержку'),
  async execute(interaction) {
    const embed = createEmbed({
      title: '🏓 Pong!',
      description: `Задержка: **${interaction.client.ws.ping}** мс`,
      color: Colors.SUCCESS
    });
    await interaction.reply({ embeds: [embed] });
  }
};