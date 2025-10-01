import discord
from discord.ext import commands

class ImageCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='boostyavatar')
    async def send_image(self, ctx):
        """Отправляет первое изображение"""
        embed = discord.Embed(
            title="Просто красивый аватар",
            description="ЭТО красивая картинка!",
            color=0x3498db
        )
        
        file = discord.File("images/boosty_avatar_sea_sign.png", filename="boosty_avatar_sea_sign.png")
        embed.set_image(url="attachment://boosty_avatar_sea_sign.png")
        embed.set_footer(text=f"Запрошено пользователем {ctx.author.display_name}")
        
        await ctx.send(file=file, embed=embed)

async def setup(bot):
    await bot.add_cog(ImageCog(bot))