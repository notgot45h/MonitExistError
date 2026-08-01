const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Colors } = require('../utils/embedStyle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Показать аватар пользователя')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Пользователь, чей аватар показать')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('size')
        .setDescription('Размер аватара (16-4096)')
        .setRequired(false)
        .setMinValue(16)
        .setMaxValue(4096)),
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user') || interaction.user;
    const size = interaction.options.getInteger('size') || 1024;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: size });

    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`Аватар ${user.username}`)
      .setDescription(`[Открыть в полном размере](${avatarURL})`)
      .setImage(avatarURL)
      .setFooter({ text: `Запросил ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};