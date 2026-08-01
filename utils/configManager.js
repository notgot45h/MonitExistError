const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config.json');

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writeConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function addAllowedUser(userId, userName = '') {
  const config = readConfig();
  const existing = config.allowedUsers.find(u => u.id === userId);
  if (existing) {
    if (userName && existing.name !== userName) {
      existing.name = userName;
      writeConfig(config);
      return true;
    }
    return false;
  }
  config.allowedUsers.push({ id: userId, name: userName || userId });
  writeConfig(config);
  return true;
}

function removeAllowedUser(userId) {
  const config = readConfig();
  const index = config.allowedUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    config.allowedUsers.splice(index, 1);
    writeConfig(config);
    return true;
  }
  return false;
}

function getAllowedUsers() {
  const config = readConfig();
  return config.allowedUsers || [];
}

module.exports = { addAllowedUser, removeAllowedUser, getAllowedUsers };