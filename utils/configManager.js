const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config.json');

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writeConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function addAllowedUser(userId) {
  const config = readConfig();
  if (!config.allowedUsers.includes(userId)) {
    config.allowedUsers.push(userId);
    writeConfig(config);
    return true;
  }
  return false;
}

function removeAllowedUser(userId) {
  const config = readConfig();
  const index = config.allowedUsers.indexOf(userId);
  if (index !== -1) {
    config.allowedUsers.splice(index, 1);
    writeConfig(config);
    return true;
  }
  return false;
}

module.exports = { addAllowedUser, removeAllowedUser };