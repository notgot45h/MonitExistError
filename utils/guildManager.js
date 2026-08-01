const fs = require('fs');
const path = require('path');
const guildsFile = path.join(__dirname, '..', 'guilds.json');

function loadGuildsFromFile() {
  if (!fs.existsSync(guildsFile)) {
    fs.writeFileSync(guildsFile, '[]', 'utf8');
  }
  return JSON.parse(fs.readFileSync(guildsFile, 'utf8'));
}

function saveGuildsToFile(guilds) {
  fs.writeFileSync(guildsFile, JSON.stringify(guilds, null, 2), 'utf8');
}

function syncGuilds(client) {
  const currentGuilds = client.guilds.cache.map(g => ({
    id: g.id,
    name: g.name
  }));
  saveGuildsToFile(currentGuilds);
  return currentGuilds;
}

function addGuildToFile(guild) {
  const guilds = loadGuildsFromFile();
  if (!guilds.find(g => g.id === guild.id)) {
    guilds.push({ id: guild.id, name: guild.name });
    saveGuildsToFile(guilds);
  }
}

function removeGuildFromFile(guild) {
  let guilds = loadGuildsFromFile();
  guilds = guilds.filter(g => g.id !== guild.id);
  saveGuildsToFile(guilds);
}

function getSavedGuilds() {
  return loadGuildsFromFile();
}

module.exports = {
  syncGuilds,
  addGuildToFile,
  removeGuildFromFile,
  getSavedGuilds
};