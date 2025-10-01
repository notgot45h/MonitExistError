# main.py
import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

# Загружаем переменные из файла .env
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

# Настраиваем права бота
intents = discord.Intents.default()
intents.message_content = True  # Необходимо для обработки команд :cite[2]

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'Бот {bot.user} успешно запущен!')
    
    # Автоматическая загрузка всех когов из папки commands
    for filename in os.listdir('./commands'):
        if filename.endswith('.py'):
            try:
                await bot.load_extension(f'commands.{filename[:-3]}')
                print(f'Загружена команда: {filename[:-3]}')
            except Exception as e:
                print(f'Не удалось загрузить {filename}: {e}')

# Запускаем бота
bot.run(TOKEN)