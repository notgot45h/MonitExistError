module.exports = {
  name: 'testdm',
  description: 'Проверить отправку личных сообщений ботом',
  usage: '!testdm',
  example: '!testdm',
  async execute(message, args, client) {
    await message.author.send('✅ Бот успешно отправляет сообщения в ЛС!').catch(() => {});
  }
};