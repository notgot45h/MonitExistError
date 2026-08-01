const fs = require('fs');
const path = require('path');
const pidFile = path.join(__dirname, '..', 'bot.pid');

function writePid(pid) {
  fs.writeFileSync(pidFile, String(pid), 'utf8');
}

function clearPid() {
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
  }
}

function checkPid() {
  if (!fs.existsSync(pidFile)) {
    return true;
  }
  try {
    const data = fs.readFileSync(pidFile, 'utf8').trim();
    const pid = parseInt(data, 10);
    if (isNaN(pid)) {
      fs.unlinkSync(pidFile);
      return true;
    }
    try {
      process.kill(pid, 0);
      return false;
    } catch (e) {
      fs.unlinkSync(pidFile);
      return true;
    }
  } catch (e) {
    return true;
  }
}

module.exports = { writePid, clearPid, checkPid };