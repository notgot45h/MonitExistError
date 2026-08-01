const { EmbedBuilder } = require('discord.js');

const Colors = {
  SUCCESS: 0x57F287,
  ERROR: 0xED4245,
  WARNING: 0xFEE75C,
  INFO: 0x5865F2
};

function createEmbed({ title, description, color = Colors.INFO, fields = [], footer = null, thumbnail = null }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title ? title.slice(0, 256) : null)
    .setDescription(description ? description.slice(0, 4096) : null);

  if (fields.length > 0) {
    embed.addFields(fields.map(f => ({
      name: f.name.slice(0, 256),
      value: f.value.slice(0, 1024),
      inline: f.inline || false
    })));
  }

  if (footer) embed.setFooter({ text: footer });
  if (thumbnail) embed.setThumbnail(thumbnail);
  embed.setTimestamp();
  return embed;
}

module.exports = { createEmbed, Colors };