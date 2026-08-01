const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Colors } = require('../utils/embedStyle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Показать информацию о пользователе')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Пользователь, о котором показать информацию')
        .setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    if (!interaction.guild) {
      return interaction.editReply('❌ Эта команда работает только на серверах.');
    }
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.editReply('Пользователь не найден на этом сервере.');
    }

    const isBot = user.id === interaction.client.user.id;

    const mutualGuilds = [];
    for (const guild of interaction.client.guilds.cache.values()) {
      try {
        const mem = await guild.members.fetch(user.id).catch(() => null);
        if (mem) mutualGuilds.push(guild.name);
      } catch (e) {}
    }
    const mutualList = mutualGuilds.length > 0 ? mutualGuilds.slice(0, 10).join(', ') : 'Нет общих серверов';
    const extra = mutualGuilds.length > 10 ? ` и ещё ${mutualGuilds.length - 10}` : '';

    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(isBot ? 'Я' : `Информация о ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Аккаунт создан', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: 'Присоединился', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
        { name: 'Роли', value: member.roles.cache.map(r => r.toString()).join(' ') || 'Нет ролей' },
        { name: 'Бот?', value: user.bot ? 'Да' : 'Нет', inline: true },
        { name: 'Статус', value: member.presence?.status || 'Неизвестно', inline: true },
        { name: 'Общие серверы', value: mutualList + extra, inline: false }
      )
      .setFooter({ text: `Запросил ${interaction.user.username}` })
      .setTimestamp();

    if (isBot) {
      embed.addFields({ name: '🎉 Интересный факт:', value: 'Смешно тебе, да? А мне нет!!!! Этот код полное **ГАВ##**', inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};