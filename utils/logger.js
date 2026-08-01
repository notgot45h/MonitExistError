const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'bot.log');

function getTimestamp() {
  return new Date().toISOString();
}

function log(level, message) {
  const entry = `[${getTimestamp()}] [${level}] ${message}`;
  console.log(entry);
  fs.appendFileSync(logFile, entry + '\n', 'utf8');
}

const logger = {
  info: (msg) => log('INFO', msg),
  warn: (msg) => log('WARN', msg),
  error: (msg) => log('ERROR', msg),
  debug: (msg) => log('DEBUG', msg),
  command: (user, guild, commandName, options) => {
    const guildInfo = guild ? `в гильдии ${guild.name}(${guild.id})` : 'в ЛС';
    log('COMMAND', `Пользователь ${user.tag}(${user.id}) выполнил /${commandName} ${options ? JSON.stringify(options) : ''} ${guildInfo}`);
  },
  cli: (action) => log('CLI', action)
};

module.exports = logger;