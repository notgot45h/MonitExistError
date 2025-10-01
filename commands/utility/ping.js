const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  // data определяет имя, описание и параметры команды
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Отвечает Pong!'),
  // execute — функция, которая выполняется при вызове команды
  async execute(interaction) {
    await interaction.reply('Pong!');
  },
};