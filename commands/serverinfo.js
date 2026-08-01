const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Colors } = require('../utils/embedStyle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Показать информацию о сервере'),
  async execute(interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply('❌ Эта команда работает только на серверах.');
    }
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`Информация о сервере ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: 'ID', value: guild.id, inline: true },
        { name: 'Владелец', value: owner.user.tag, inline: true },
        { name: 'Создан', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: 'Участников', value: `${guild.memberCount}`, inline: true },
        { name: 'Каналов (всего)', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Ролей', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Уровень проверки', value: `${guild.verificationLevel}`, inline: true },
        { name: 'Буст-уровень', value: `${guild.premiumTier}`, inline: true },
        { name: 'Эмодзи', value: `${guild.emojis.cache.size}`, inline: true }
      )
      .setFooter({ text: `Запросил ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};