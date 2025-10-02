const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Показывает задержку бота и API Discord'),
    async execute(interaction) {
        const startTime = Date.now();

        await interaction.reply({ 
            content: '⌛ Измеряю задержку...' 
        });

        const endTime = Date.now();

        const roundtripLatency = endTime - interaction.createdTimestamp;
        const websocketPing = interaction.client.ws.ping;

        const pingEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🏓 Понг! Текущая задержка:')
            .addFields(
                { 
                    name: '📡 Задержка сообщения', 
                    value: `**${roundtripLatency}мс**\nВремя отклика бота на команду`, 
                    inline: true 
                },
                { 
                    name: '🔌 WebSocket', 
                    value: `**${websocketPing}мс**\nПинг соединения с Discord`, 
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Запрос от ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await interaction.editReply({ 
            content: '', 
            embeds: [pingEmbed] 
        });
    }
};