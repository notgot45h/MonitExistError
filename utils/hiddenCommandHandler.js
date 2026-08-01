const fs = require('fs');
const path = require('path');
const hiddenCommands = new Map();

function loadHiddenCommands() {
  hiddenCommands.clear();
  const hiddenPath = path.join(__dirname, '..', 'hiddencommands');
  if (!fs.existsSync(hiddenPath)) {
    fs.mkdirSync(hiddenPath, { recursive: true });
    return hiddenCommands;
  }
  const files = fs.readdirSync(hiddenPath).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(hiddenPath, file);
    delete require.cache[require.resolve(filePath)];
    try {
      const command = require(filePath);
      if (command.name && typeof command.execute === 'function') {
        hiddenCommands.set(command.name, command);
      }
    } catch (err) {
      console.error(`Ошибка загрузки скрытой команды ${file}:`, err.message);
    }
  }
  return hiddenCommands;
}

function getHiddenCommand(name) {
  return hiddenCommands.get(name);
}

module.exports = { loadHiddenCommands, getHiddenCommand };