const API_BASE = '/api';
let currentPage = 'servers';
let logInterval = null;
let autoScroll = true;
let chartInstance = null;
let modalFiles = [];
let actionFiles = [];

function $(id) { return document.getElementById(id); }

async function fetchJSON(url, opts={}) {
  const res = await fetch(url, opts);
  return res.json();
}

function formatUptime(sec) {
  if (!sec) return '0s';
  const d = Math.floor(sec/86400);
  const h = Math.floor((sec%86400)/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  return (d?d+'d ':'')+(h?h+'h ':'')+(m?m+'m ':'')+s+'s';
}

function updateFileList(containerId, fileList, inputId) {
  const container = $(containerId);
  container.innerHTML = '';
  if (fileList.length === 0) {
    container.innerHTML = '<span style="color:#404040;font-size:0.9rem;">Файлы не выбраны</span>';
    return;
  }
  const ul = document.createElement('ul');
  ul.style.cssText = 'list-style:none;padding:0;margin:4px 0;';
  fileList.forEach((f, i) => {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:2px 6px;background:#e0e0e0;border:1px solid #808080;margin-bottom:2px;';
    li.innerHTML = `<span>${f.name} (${(f.size/1024).toFixed(1)} KB)</span><button data-idx="${i}" class="button file-remove" style="background:none;border:2px solid #808080;border-top-color:#fff;border-left-color:#fff;padding:0 6px;cursor:pointer;font-weight:bold;">×</button>`;
    container.appendChild(li);
  });
  container.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.idx);
      if (containerId === 'modal-file-list') {
        modalFiles.splice(idx, 1);
        updateFileList('modal-file-list', modalFiles, 'modal-file-input');
        $(inputId).value = '';
      } else if (containerId === 'act-file-list') {
        actionFiles.splice(idx, 1);
        updateFileList('act-file-list', actionFiles, 'act-file-input');
        $(inputId).value = '';
      }
    });
  });
}

async function loadGuilds() {
  const data = await fetchJSON('/api/guilds');
  if (data.error) { $('servers-grid').innerHTML = `<p>${data.error}</p>`; return; }
  const grid = $('servers-grid');
  grid.innerHTML = '';
  const search = $('server-search').value.toLowerCase();
  const sort = $('server-sort').value;
  let filtered = data.filter(g => g.name.toLowerCase().includes(search));
  if (sort === 'members') filtered.sort((a,b) => b.memberCount - a.memberCount);
  else filtered.sort((a,b) => a.name.localeCompare(b.name));
  filtered.forEach(g => {
    const card = document.createElement('div');
    card.className = 'server-card';
    card.innerHTML = `
      <img src="${g.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${g.name}">
      <div class="name">${g.name}</div>
      <div class="info">👥 ${g.memberCount} • <span onclick="copyId('${g.id}')" style="cursor:pointer;">📋 ${g.id}</span></div>
    `;
    card.addEventListener('click', () => showServerDetail(g.id));
    grid.appendChild(card);
  });
}

async function showServerDetail(guildId) {
  const data = await fetchJSON(`/api/guild/${guildId}/info`);
  if (data.error) { alert(data.error); return; }
  const modal = $('server-modal');
  const content = $('server-detail-content');
  content.innerHTML = `
    <h3>${data.name}</h3>
    <img src="${data.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'}" style="width:80px;border:1px solid #808080;">
    <p><strong>ID:</strong> ${data.id} <span onclick="copyId('${data.id}')" style="cursor:pointer;">📋</span></p>
    <p><strong>Владелец:</strong> ${data.owner}</p>
    <p><strong>Участников:</strong> ${data.memberCount}</p>
    <p><strong>Каналов:</strong> ${data.channelCount}</p>
    <p><strong>Ролей:</strong> ${data.roleCount}</p>
    <p><strong>Создан:</strong> ${new Date(data.createdTimestamp).toLocaleDateString()}</p>
    <p><strong>Уровень проверки:</strong> ${data.verificationLevel}</p>
    <p><strong>Буст-уровень:</strong> ${data.premiumTier}</p>
  `;
  const channels = await fetchJSON(`/api/guild/${guildId}/channels`);
  const sel = $('modal-channel-select');
  sel.innerHTML = '';
  if (channels.error) {
    sel.innerHTML = '<option>Ошибка загрузки каналов</option>';
  } else {
    channels.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = ch.name;
      sel.appendChild(opt);
    });
  }
  modalFiles = [];
  updateFileList('modal-file-list', modalFiles, 'modal-file-input');
  $('modal-message-text').value = '';
  $('modal-send-result').textContent = '';
  modal.style.display = 'block';
}

document.querySelector('.modal-close').addEventListener('click', () => {
  $('server-modal').style.display = 'none';
});
window.addEventListener('click', e => { if (e.target === $('server-modal')) $('server-modal').style.display = 'none'; });

document.getElementById('modal-file-input').addEventListener('change', function() {
  const files = Array.from(this.files);
  if (modalFiles.length + files.length > 10) {
    alert('Максимум 10 файлов');
    this.value = '';
    return;
  }
  const oversized = files.some(f => f.size > 25 * 1024 * 1024);
  if (oversized) {
    alert('Файл превышает 25MB');
    this.value = '';
    return;
  }
  modalFiles = modalFiles.concat(files);
  updateFileList('modal-file-list', modalFiles, 'modal-file-input');
  this.value = '';
});

document.getElementById('act-file-input').addEventListener('change', function() {
  const files = Array.from(this.files);
  if (actionFiles.length + files.length > 10) {
    alert('Максимум 10 файлов');
    this.value = '';
    return;
  }
  const oversized = files.some(f => f.size > 25 * 1024 * 1024);
  if (oversized) {
    alert('Файл превышает 25MB');
    this.value = '';
    return;
  }
  actionFiles = actionFiles.concat(files);
  updateFileList('act-file-list', actionFiles, 'act-file-input');
  this.value = '';
});

async function loadCommands() {
  const data = await fetchJSON('/api/commands/status');
  const tbody = $('commands-tbody');
  tbody.innerHTML = '';
  const search = $('cmd-search').value.toLowerCase();
  data.forEach(item => {
    if (search && !item.file.toLowerCase().includes(search)) return;
    const tr = document.createElement('tr');
    const loaded = item.loaded === 'Да';
    tr.innerHTML = `
      <td>${item.file}</td>
      <td><button class="cmd-toggle ${loaded?'enabled':'disabled'}" data-name="${item.file}" data-state="${loaded}">${loaded?'Вкл':'Выкл'}</button></td>
      <td><button class="cmd-reload button" data-name="${item.file}">Перезагрузить</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.cmd-toggle').forEach(btn => {
    btn.addEventListener('click', async function() {
      const name = this.dataset.name;
      const current = this.dataset.state === 'true';
      const newState = !current;
      if (!confirm(`${name} ${newState?'включить':'выключить'}?`)) return;
      const res = await fetchJSON('/api/commands/toggle', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, enabled: newState })
      });
      if (res.success) loadCommands();
    });
  });
  document.querySelectorAll('.cmd-reload').forEach(btn => {
    btn.addEventListener('click', async function() {
      const name = this.dataset.name;
      const res = await fetchJSON('/api/commands/reload', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name })
      });
      if (res.success) loadCommands();
    });
  });
}

async function loadLogs() {
  const level = $('log-level').value;
  const search = $('log-search').value;
  const limit = 200;
  const data = await fetchJSON(`/api/logs?level=${level}&search=${encodeURIComponent(search)}&limit=${limit}`);
  const out = $('log-output');
  out.innerHTML = data.map(e => {
    const cls = e.level.toLowerCase();
    return `<div class="log-entry ${cls}">[${e.timestamp}] [${e.level}] ${e.message}</div>`;
  }).join('');
  if (autoScroll) {
    const container = $('log-container');
    container.scrollTop = container.scrollHeight;
  }
}

async function loadUsers() {
  const data = await fetchJSON('/api/users');
  const list = $('users-list');
  list.innerHTML = '';
  data.allowedUsers.forEach(user => {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.innerHTML = `
      <span>
        <span class="user-name">${user.name || 'Без имени'}</span>
        <span class="user-id">(${user.id})</span>
      </span>
      <button class="button" data-id="${user.id}" style="background:none;border:2px solid #808080;border-top-color:#fff;border-left-color:#fff;padding:2px 12px;cursor:pointer;">Удалить</button>
    `;
    list.appendChild(div);
  });
  document.querySelectorAll('.user-item button').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = this.dataset.id;
      if (!confirm(`Удалить пользователя ${id}?`)) return;
      const res = await fetchJSON('/api/users/remove', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ userId: id })
      });
      if (res.success) loadUsers();
    });
  });
}

async function loadGuildSelects() {
  const data = await fetchJSON('/api/guilds');
  if (data.error) return;
  const selects = ['act-guild-select', 'role-guild-select', 'act-update-guild-select'];
  selects.forEach(id => {
    const sel = $(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Выберите сервер</option>';
    data.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  });
}

async function loadChannels(guildId) {
  if (!guildId) { $('act-channel-select').innerHTML = '<option value="">Выберите канал</option>'; return; }
  const data = await fetchJSON(`/api/guild/${guildId}/channels`);
  const sel = $('act-channel-select');
  sel.innerHTML = '<option value="">Выберите канал</option>';
  if (data.error) { sel.innerHTML += `<option value="">Ошибка загрузки</option>`; return; }
  data.forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch.id;
    opt.textContent = ch.name;
    sel.appendChild(opt);
  });
}

async function loadRoles(guildId) {
  if (!guildId) { $('role-select').innerHTML = '<option value="">Выберите роль</option>'; return; }
  const data = await fetchJSON(`/api/guild/${guildId}/roles`);
  const sel = $('role-select');
  sel.innerHTML = '<option value="">Выберите роль</option>';
  if (data.error) { sel.innerHTML += `<option value="">Ошибка загрузки</option>`; return; }
  data.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    sel.appendChild(opt);
  });
}

function copyId(id) {
  navigator.clipboard?.writeText(id);
}

function toggleSidebar(open) {
  const sidebar = $('sidebar');
  if (open === undefined) {
    sidebar.classList.toggle('open');
  } else if (open) {
    sidebar.classList.add('open');
  } else {
    sidebar.classList.remove('open');
  }
}

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = $('page-'+page);
  if (target) target.classList.add('active');
  document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.remove('active'));
  document.querySelector(`#sidebar nav a[data-page="${page}"]`)?.classList.add('active');
  $('page-title').textContent = page.charAt(0).toUpperCase() + page.slice(1);
  if (page === 'servers') loadGuilds();
  if (page === 'commands') loadCommands();
  if (page === 'logs') loadLogs();
  if (page === 'settings') loadUsers();
  if (page === 'actions') {
    loadGuildSelects();
    const guildId = $('act-guild-select').value;
    if (guildId) loadChannels(guildId);
    const roleGuild = $('role-guild-select').value;
    if (roleGuild) loadRoles(roleGuild);
  }
  if (window.innerWidth <= 768) toggleSidebar(false);
}

document.querySelectorAll('#sidebar nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showPage(a.dataset.page);
  });
});

document.getElementById('sidebar-toggle').addEventListener('click', () => toggleSidebar());
document.getElementById('sidebar-close').addEventListener('click', () => toggleSidebar(false));
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    const sidebar = $('sidebar');
    const toggle = $('sidebar-toggle');
    if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('open')) {
      toggleSidebar(false);
    }
  }
});

document.getElementById('server-search').addEventListener('input', loadGuilds);
document.getElementById('server-sort').addEventListener('change', loadGuilds);
document.getElementById('cmd-search').addEventListener('input', loadCommands);
document.getElementById('cmd-refresh').addEventListener('click', loadCommands);

document.getElementById('log-level').addEventListener('change', loadLogs);
document.getElementById('log-search').addEventListener('input', loadLogs);
document.getElementById('log-auto-scroll').addEventListener('click', function() {
  autoScroll = !autoScroll;
  this.classList.toggle('active');
});
document.getElementById('log-clear').addEventListener('click', async function() {
  if (!confirm('Очистить логи?')) return;
  await fetchJSON('/api/logs/clear', { method: 'POST' });
  loadLogs();
});

setInterval(loadLogs, 3000);

document.getElementById('quick-start').addEventListener('click', () => { document.getElementById('act-start').click(); });
document.getElementById('quick-stop').addEventListener('click', () => { document.getElementById('act-stop').click(); });
document.getElementById('quick-restart').addEventListener('click', () => { document.getElementById('act-restart').click(); });

document.getElementById('act-start').addEventListener('click', async function() {
  const res = await fetchJSON('/api/bot/start', { method: 'POST' });
  if (res.success) { alert('Бот запущен'); updateStatus(); } else alert('Ошибка: '+res.error);
});
document.getElementById('act-stop').addEventListener('click', async function() {
  const res = await fetchJSON('/api/bot/stop', { method: 'POST' });
  if (res.success) { alert('Бот остановлен'); updateStatus(); } else alert('Ошибка: '+res.error);
});
document.getElementById('act-restart').addEventListener('click', async function() {
  const res = await fetchJSON('/api/restart', { method: 'POST' });
  if (res.success) { alert('Перезагрузка...'); updateStatus(); } else alert('Ошибка');
});
document.getElementById('act-shutdown').addEventListener('click', async function() {
  if (!confirm('Завершить процесс?')) return;
  const res = await fetchJSON('/api/shutdown', { method: 'POST' });
  if (res.success) alert('Процесс завершается');
});

document.getElementById('act-sendall').addEventListener('click', async function() {
  const text = prompt('Введите текст для отправки всем:');
  if (!text) return;
  const res = await fetchJSON('/api/sendall', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });
  if (res.success) alert(`Отправлено на ${res.count} серверов`);
});

async function sendMessage(guildId, channelId, text, files, resultElement) {
  if (!guildId || !channelId) {
    resultElement.textContent = '❌ Выберите сервер и канал';
    return;
  }
  const formData = new FormData();
  formData.append('guildId', guildId);
  formData.append('channelId', channelId);
  if (text) formData.append('text', text);
  files.forEach(f => formData.append('files', f, f.name));

  try {
    const res = await fetch('/api/send', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      resultElement.textContent = '✅ Сообщение отправлено';
    } else {
      resultElement.textContent = '❌ Ошибка: ' + data.error;
    }
  } catch (e) {
    resultElement.textContent = '❌ Ошибка запроса';
  }
}

document.getElementById('modal-send-message').addEventListener('click', async function() {
  const guildId = document.querySelector('#server-detail-content h3')?.textContent?.trim() ? 
    (await fetchJSON('/api/guilds')).find(g => g.name === document.querySelector('#server-detail-content h3').textContent)?.id : 
    null;
  if (!guildId) { $('modal-send-result').textContent = '❌ Не удалось определить сервер'; return; }
  const channelId = $('modal-channel-select').value;
  const text = $('modal-message-text').value;
  await sendMessage(guildId, channelId, text, modalFiles, $('modal-send-result'));
  if ($('modal-send-result').textContent.includes('✅')) {
    modalFiles = [];
    updateFileList('modal-file-list', modalFiles, 'modal-file-input');
    $('modal-message-text').value = '';
  }
});

document.getElementById('act-send-guild').addEventListener('click', async function() {
  const guildId = $('act-guild-select').value;
  const channelId = $('act-channel-select').value;
  const text = $('act-send-text').value;
  await sendMessage(guildId, channelId, text, actionFiles, $('send-result'));
  if ($('send-result').textContent.includes('✅')) {
    actionFiles = [];
    updateFileList('act-file-list', actionFiles, 'act-file-input');
    $('act-send-text').value = '';
  }
});

document.getElementById('act-guild-select').addEventListener('change', function() {
  loadChannels(this.value);
});

document.getElementById('role-guild-select').addEventListener('change', function() {
  loadRoles(this.value);
});

document.getElementById('role-give').addEventListener('click', async function() {
  const guildId = $('role-guild-select').value;
  const roleId = $('role-select').value;
  const userId = $('role-user-id').value;
  if (!guildId || !roleId || !userId) {
    alert('Выберите сервер, роль и введите ID пользователя');
    return;
  }
  const res = await fetchJSON('/api/roles/give', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ guildId, userId, roleId })
  });
  if (res.success) $('role-result').textContent = '✅ Роль выдана';
  else $('role-result').textContent = '❌ Ошибка: '+res.error;
});

document.getElementById('role-remove').addEventListener('click', async function() {
  const guildId = $('role-guild-select').value;
  const roleId = $('role-select').value;
  const userId = $('role-user-id').value;
  if (!guildId || !roleId || !userId) {
    alert('Выберите сервер, роль и введите ID пользователя');
    return;
  }
  const res = await fetchJSON('/api/roles/remove', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ guildId, userId, roleId })
  });
  if (res.success) $('role-result').textContent = '✅ Роль снята';
  else $('role-result').textContent = '❌ Ошибка: '+res.error;
});

document.getElementById('act-update-global').addEventListener('click', async function() {
  if (!confirm('Обновить глобальные команды?')) return;
  const res = await fetchJSON('/api/commands/update-global', { method: 'POST' });
  if (res.success) alert('Глобальные команды обновлены');
  else alert('Ошибка: '+res.error);
});

document.getElementById('act-update-guild').addEventListener('click', async function() {
  const guildId = $('act-update-guild-select').value;
  if (!guildId) { alert('Выберите сервер'); return; }
  if (!confirm(`Обновить команды на сервере ${guildId}?`)) return;
  const res = await fetchJSON('/api/commands/update-guild', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ guildId })
  });
  if (res.success) alert('Команды обновлены');
  else alert('Ошибка: '+res.error);
});

document.getElementById('act-update-all-guilds').addEventListener('click', async function() {
  if (!confirm('Обновить команды на всех серверах?')) return;
  const res = await fetchJSON('/api/commands/update-guild', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ all: true })
  });
  if (res.success) alert(`Обновлено на ${res.count} из ${res.total} серверов`);
  else alert('Ошибка: '+res.error);
});

document.getElementById('add-user-btn').addEventListener('click', async function() {
  const id = document.getElementById('add-user-id').value.trim();
  const name = document.getElementById('add-user-name').value.trim();
  if (!id) return alert('Введите ID пользователя');
  const res = await fetchJSON('/api/users/add', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId: id, name: name || '' })
  });
  if (res.success) {
    loadUsers();
    document.getElementById('add-user-id').value = '';
    document.getElementById('add-user-name').value = '';
  } else {
    alert('Ошибка при добавлении');
  }
});

async function updateStatus() {
  const data = await fetchJSON('/api/bot/status');
  const badge = $('status-badge');
  if (data.running) {
    badge.textContent = 'Онлайн (' + (data.user || 'без имени') + ')';
    badge.className = 'online';
  } else {
    badge.textContent = 'Оффлайн';
    badge.className = 'offline';
  }
}

showPage('servers');
updateStatus();
setInterval(updateStatus, 5000);