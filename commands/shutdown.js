const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createEmbed, Colors } = require('../utils/embedStyle');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Выключить бота'),
  async execute(interaction) {
    if (!config.superAdmins.includes(interaction.user.id)) {
      const embed = createEmbed({ title: '❌ Ошибка', description: 'У тебя нету оружия!', color: Colors.ERROR });
      return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }

    await interaction.reply({ embeds: [createEmbed({ title: '⏳ Почти...', description: 'Бот в агонии, ты молодец)', color: Colors.WARNING })], flags: [MessageFlags.Ephemeral] });
    setTimeout(() => process.exit(0), 2000);
  }
};