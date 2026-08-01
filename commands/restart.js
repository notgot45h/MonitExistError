const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const config = require('../config.json');
const { createEmbed, Colors } = require('../utils/embedStyle');
const core = require('../utils/core');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Перезагрузить бота'),
  async execute(interaction) {
    if (!config.allowedUsers.includes(interaction.user.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'Недостаточно прав.', color: Colors.ERROR });
      return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }

    const embed = createEmbed({ title: '🔄 Перезагрузка', description: 'Бот перезагружается...', color: Colors.WARNING });
    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

    core.restartBot();
  }
};