# commands/image.py
import discord
from discord.ext import commands

class ImageCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='boostyavatar')
    async def send_image(self, ctx):
        """Отправляет первое изображение"""
        # Создаем красивое встроенное сообщение
        embed = discord.Embed(
            title="🎨 Моё первое изображение",
            description="Вот красивая картинка!",
            color=0x3498db
        )
        
        # Прикрепляем файл и устанавливаем его как изображение в Embed
        file = discord.File("images/boosty_avatar_sea_sign.png", filename="image.png")
        embed.set_image(url="attachment://image.png")
        embed.set_footer(text=f"Запрошено пользователем {ctx.author.display_name}")
        
        await ctx.send(file=file, embed=embed)

async def setup(bot):
    await bot.add_cog(ImageCog(bot))