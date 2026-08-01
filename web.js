const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const core = require('./utils/core');
const {
  loadCommands,
  registerGlobally,
  registerForGuild,
  getAllCommandFiles,
  isCommandLoaded,
  loadSingleCommand,
  unloadCommand
} = require('./utils/commandHandler');
const { addAllowedUser, removeAllowedUser } = require('./utils/configManager');
const config = require('./config.json');
const logger = require('./utils/logger');

const app = express();
const PORT = 3000;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 10;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats', (req, res) => {
  const stats = core.getStats();
  res.json(stats);
});

app.get('/api/activity', (req, res) => {
  const logPath = path.join(__dirname, 'bot.log');
  if (!fs.existsSync(logPath)) return res.json([]);
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l.trim());
  const last7days = [];
  const now = Date.now();
  const dayMs = 86400000;
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now - i * dayMs);
    const dateStr = day.toISOString().slice(0,10);
    const count = lines.filter(l => l.includes(dateStr) && l.includes('COMMAND')).length;
    last7days.push({ date: dateStr, count });
  }
  res.json(last7days);
});

app.get('/api/guilds', (req, res) => {
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guilds = client.guilds.cache.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL({ dynamic: true, size: 128 }),
    memberCount: g.memberCount,
    ownerId: g.ownerId,
    createdTimestamp: g.createdTimestamp
  }));
  res.json(guilds);
});

app.get('/api/guild/:guildId/info', async (req, res) => {
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Сервер не найден' });
  try {
    const owner = await guild.fetchOwner();
    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 256 }),
      owner: owner.user.tag,
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      createdTimestamp: guild.createdTimestamp,
      verificationLevel: guild.verificationLevel,
      premiumTier: guild.premiumTier
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/guild/:guildId/channels', (req, res) => {
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Сервер не найден' });
  const channels = guild.channels.cache
    .filter(c => c.type === 0)
    .map(c => ({ id: c.id, name: '#' + c.name }));
  res.json(channels);
});

app.get('/api/guild/:guildId/roles', (req, res) => {
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Сервер не найден' });
  const roles = guild.roles.cache
    .filter(r => r.name !== '@everyone')
    .map(r => ({ id: r.id, name: r.name }));
  res.json(roles);
});

app.post('/api/send', upload.array('files', MAX_FILES), async (req, res) => {
  const { guildId, channelId, text } = req.body;
  if (!guildId || !channelId) {
    return res.status(400).json({ error: 'Не указаны guildId или channelId' });
  }
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Сервер не найден' });
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return res.status(404).json({ error: 'Канал не найден' });

  const files = req.files || [];
  if (files.length > MAX_FILES) {
    return res.status(400).json({ error: `Максимум ${MAX_FILES} файлов` });
  }

  try {
    const attachments = files.map(f => ({
      attachment: f.buffer,
      name: f.originalname
    }));
    await channel.send({ content: text || undefined, files: attachments });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sendall', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст не указан' });
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  let count = 0;
  for (const guild of client.guilds.cache.values()) {
    const ch = guild.channels.cache.find(
      c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages')
    );
    if (ch) {
      try {
        await ch.send(text);
        count++;
      } catch (_) {}
    }
  }
  res.json({ success: true, count });
});

app.get('/api/commands/status', (req, res) => {
  const files = getAllCommandFiles();
  const status = files.map(f => ({
    file: f,
    loaded: isCommandLoaded(f) ? 'Да' : 'Нет'
  }));
  res.json(status);
});

app.post('/api/commands/update-global', async (req, res) => {
  try {
    loadCommands();
    await registerGlobally(config.token, config.clientId, 20000);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/commands/update-guild', async (req, res) => {
  const { guildId, all } = req.body;
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  try {
    loadCommands();
    if (all) {
      const guilds = client.guilds.cache.map(g => g.id);
      let successCount = 0;
      for (const gid of guilds) {
        try {
          await registerForGuild(config.token, config.clientId, gid, 20000);
          successCount++;
        } catch (_) {}
      }
      res.json({ success: true, count: successCount, total: guilds.length });
    } else if (guildId) {
      await registerForGuild(config.token, config.clientId, guildId, 20000);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Укажите guildId или all' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/commands/reload', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Не указано имя команды' });
  try {
    const cmd = loadSingleCommand(name);
    if (!cmd) return res.status(404).json({ error: 'Команда не найдена' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/commands/toggle', (req, res) => {
  const { name, enabled } = req.body;
  if (!name) return res.status(400).json({ error: 'Не указано имя команды' });
  const statePath = path.join(__dirname, 'command_state.json');
  let state = {};
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  state[name] = enabled;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  if (!enabled) {
    unloadCommand(name);
  } else {
    try {
      loadSingleCommand(name);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
  const { level, search, limit } = req.query;
  const logPath = path.join(__dirname, 'bot.log');
  if (!fs.existsSync(logPath)) return res.json([]);
  let lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l.trim());
  if (level) {
    lines = lines.filter(l => l.includes(`[${level}]`));
  }
  if (search) {
    lines = lines.filter(l => l.toLowerCase().includes(search.toLowerCase()));
  }
  const count = parseInt(limit) || 100;
  lines = lines.slice(-count);
  const parsed = lines.map(l => {
    const match = l.match(/\[(.*?)\] \[(.*?)\] (.*)/);
    if (match) {
      return { timestamp: match[1], level: match[2], message: match[3] };
    }
    return { timestamp: '', level: 'UNKNOWN', message: l };
  });
  res.json(parsed);
});

app.post('/api/logs/clear', (req, res) => {
  const logPath = path.join(__dirname, 'bot.log');
  if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '');
  }
  res.json({ success: true });
});

app.post('/api/roles/give', async (req, res) => {
  const { guildId, userId, roleId } = req.body;
  if (!guildId || !userId || !roleId) {
    return res.status(400).json({ error: 'Не все поля заполнены' });
  }
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Сервер не найден' });
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return res.status(404).json({ error: 'Участник не найден' });
  const role = guild.roles.cache.get(roleId);
  if (!role) return res.status(404).json({ error: 'Роль не найдена' });
  try {
    await member.roles.add(role);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/roles/remove', async (req, res) => {
  const { guildId, userId, roleId } = req.body;
  if (!guildId || !userId || !roleId) {
    return res.status(400).json({ error: 'Не все поля заполнены' });
  }
  const client = core.getClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: 'Бот не готов' });
  }
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return res.status(404).json({ error: 'Сервер не найден' });
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return res.status(404).json({ error: 'Участник не найден' });
  const role = guild.roles.cache.get(roleId);
  if (!role) return res.status(404).json({ error: 'Роль не найдена' });
  try {
    await member.roles.remove(role);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users', (req, res) => {
  res.json({ allowedUsers: config.allowedUsers, superAdmins: config.superAdmins });
});

app.post('/api/users/add', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Не указан ID' });
  const added = addAllowedUser(userId);
  res.json({ success: added });
});

app.delete('/api/users/remove', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Не указан ID' });
  const removed = removeAllowedUser(userId);
  res.json({ success: removed });
});

app.post('/api/restart', (req, res) => {
  res.json({ success: true });
  setTimeout(() => core.restartBot(), 100);
});

app.post('/api/shutdown', (req, res) => {
  res.json({ success: true });
  setTimeout(() => process.exit(0), 100);
});

app.post('/api/bot/start', async (req, res) => {
  try {
    await core.startBot();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bot/stop', async (req, res) => {
  try {
    await core.stopBot();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/bot/status', (req, res) => {
  const running = core.isBotRunning();
  const client = core.getClient();
  const user = client && client.user ? client.user.tag : null;
  res.json({ running, user });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Веб-интерфейс доступен по адресу http://localhost:${PORT}`);
  const interfaces = os.networkInterfaces();
  let localIp = 'не определён';
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        localIp = alias.address;
        break;
      }
    }
    if (localIp !== 'не определён') break;
  }
  logger.info(`Доступ с других устройств в локальной сети: http://${localIp}:${PORT}`);
});