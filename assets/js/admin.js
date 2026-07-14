const OWNER = 'LeoReAlert';
const REPO = 'killersbr-site';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

const state = {
  token: sessionStorage.getItem('killersbr_admin_token') || '',
  files: {}
};

const loginPanel = document.getElementById('loginPanel');
const adminArea = document.getElementById('adminArea');
const loginForm = document.getElementById('loginForm');
const tokenInput = document.getElementById('tokenInput');
const logoutButton = document.getElementById('logoutButton');
const statusBox = document.getElementById('statusBox');
const rankingBody = document.getElementById('rankingEditorBody');
const htmlEditor = document.getElementById('htmlEditor');

function showStatus(message, type = 'success') {
  statusBox.textContent = message;
  statusBox.className = `toast show ${type}`;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    statusBox.className = 'toast';
  }, 4200);
}

function setLoggedIn(loggedIn) {
  loginPanel.classList.toggle('is-hidden', loggedIn);
  adminArea.classList.toggle('is-hidden', !loggedIn);
}

function encodeBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64(text) {
  return decodeURIComponent(escape(atob(text.replace(/\n/g, ''))));
}

async function githubRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${state.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Falha ao comunicar com o GitHub.');
  }

  return data;
}

async function loadFile(path) {
  const data = await githubRequest(`/contents/${path}?ref=${BRANCH}`);
  const file = {
    sha: data.sha,
    content: decodeBase64(data.content || '')
  };

  state.files[path] = file;
  return file;
}

async function saveFile(path, content, message) {
  const current = state.files[path] || await loadFile(path);

  const data = await githubRequest(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      sha: current.sha,
      branch: BRANCH
    })
  });

  state.files[path] = {
    sha: data.content.sha,
    content
  };
}

function extractRanking(appJs) {
  const match = appJs.match(/const rankingPlayers = \[([\s\S]*?)\];/);

  if (!match) {
    throw new Error('Nao encontrei o array rankingPlayers em assets/js/app.js.');
  }

  return Function(`"use strict"; return [${match[1]}];`)();
}

function formatRanking(players) {
  const rows = players.map(player => {
    const name = JSON.stringify(player.name || '');
    const characterClass = JSON.stringify(player.characterClass || '');
    return `      { name: ${name}, characterClass: ${characterClass} }`;
  });

  return `const rankingPlayers = [\n${rows.join(',\n')}\n    ];`;
}

function renderRankingEditor(players) {
  rankingBody.innerHTML = players.map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><input data-ranking-field="name" value="${escapeAttribute(player.name || '')}"></td>
      <td><input data-ranking-field="characterClass" value="${escapeAttribute(player.characterClass || '')}"></td>
      <td><button type="button" class="remove-row" data-remove-row="${index}">Remover</button></td>
    </tr>
  `).join('');
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readRankingEditor() {
  return Array.from(rankingBody.querySelectorAll('tr')).map(row => {
    const name = row.querySelector('[data-ranking-field="name"]').value.trim();
    const characterClass = row.querySelector('[data-ranking-field="characterClass"]').value.trim();

    return { name, characterClass };
  }).filter(player => player.name || player.characterClass);
}

async function loadRanking() {
  showStatus('Carregando ranking...', 'success');
  const file = await loadFile('assets/js/app.js');
  renderRankingEditor(extractRanking(file.content));
  showStatus('Ranking carregado.');
}

async function saveRanking() {
  const file = state.files['assets/js/app.js'] || await loadFile('assets/js/app.js');
  const players = readRankingEditor();
  const updatedContent = file.content.replace(/const rankingPlayers = \[[\s\S]*?\];/, formatRanking(players));

  await saveFile('assets/js/app.js', updatedContent, 'Update ranking from admin panel');
  renderRankingEditor(players);
  showStatus('Ranking salvo no GitHub. O Pages atualiza em alguns minutos.');
}

async function loadHtml() {
  showStatus('Carregando HTML...', 'success');
  const file = await loadFile('index.html');
  htmlEditor.value = file.content;
  showStatus('HTML carregado.');
}

async function saveHtml() {
  await saveFile('index.html', htmlEditor.value, 'Update site content from admin panel');
  showStatus('HTML salvo no GitHub. O Pages atualiza em alguns minutos.');
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const token = tokenInput.value.trim();

  if (!token) {
    showStatus('Informe o token do GitHub.', 'error');
    return;
  }

  state.token = token;
  sessionStorage.setItem('killersbr_admin_token', token);

  try {
    await githubRequest('');
    setLoggedIn(true);
    await Promise.all([loadRanking(), loadHtml()]);
  } catch (error) {
    sessionStorage.removeItem('killersbr_admin_token');
    state.token = '';
    showStatus(error.message, 'error');
  }
});

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem('killersbr_admin_token');
  state.token = '';
  tokenInput.value = '';
  setLoggedIn(false);
  showStatus('Voce saiu do painel.');
});

document.querySelectorAll('[data-admin-tab]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-admin-tab]').forEach(tab => {
      tab.classList.toggle('active', tab === button);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${button.dataset.adminTab}Panel`);
    });
  });
});

rankingBody.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-row]');

  if (!button) return;

  const players = readRankingEditor();
  players.splice(Number(button.dataset.removeRow), 1);
  renderRankingEditor(players);
});

document.getElementById('addRankingButton').addEventListener('click', () => {
  const players = readRankingEditor();
  players.push({ name: '', characterClass: '' });
  renderRankingEditor(players);
});

document.getElementById('loadRankingButton').addEventListener('click', () => loadRanking().catch(error => showStatus(error.message, 'error')));
document.getElementById('saveRankingButton').addEventListener('click', () => saveRanking().catch(error => showStatus(error.message, 'error')));
document.getElementById('loadHtmlButton').addEventListener('click', () => loadHtml().catch(error => showStatus(error.message, 'error')));
document.getElementById('saveHtmlButton').addEventListener('click', () => saveHtml().catch(error => showStatus(error.message, 'error')));

if (state.token) {
  setLoggedIn(true);
  Promise.all([loadRanking(), loadHtml()]).catch(error => {
    setLoggedIn(false);
    showStatus(error.message, 'error');
  });
}
