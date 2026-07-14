const ADMIN_EMAIL = 'killersbr.brasil@killers.com.br';
const ADMIN_PASSWORD = 'killersBr@2026';
const DRAFT_KEYS = {
  ranking: 'killersbr_draft_ranking',
  guide: 'killersbr_draft_guide',
  youtube: 'killersbr_draft_youtube_api_key',
  html: 'killersbr_draft_html'
};

const loginPanel = document.getElementById('loginPanel');
const adminArea = document.getElementById('adminArea');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const logoutButton = document.getElementById('logoutButton');
const statusBox = document.getElementById('statusBox');
const rankingBody = document.getElementById('rankingEditorBody');
const guideEditor = document.getElementById('guideEditor');
const youtubeApiKeyInput = document.getElementById('youtubeApiKeyInput');
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

function extractBlock(content, startMarker, endMarker) {
  const pattern = new RegExp(`(\\s*<!-- ${startMarker} -->\\n)([\\s\\S]*?)(\\n\\s*<!-- ${endMarker} -->)`);
  const match = content.match(pattern);

  if (!match) {
    throw new Error(`Nao encontrei o bloco ${startMarker} em index.html.`);
  }

  return {
    pattern,
    body: match[2].trim()
  };
}

function replaceBlock(content, startMarker, endMarker, body) {
  const pattern = new RegExp(`(\\s*<!-- ${startMarker} -->\\n)([\\s\\S]*?)(\\n\\s*<!-- ${endMarker} -->)`);
  if (!pattern.test(content)) {
    throw new Error(`Nao encontrei o bloco ${startMarker} em index.html.`);
  }

  return content.replace(pattern, (_, start, __, end) => `${start}${body.trim()}${end}`);
}

function readLocalJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeLocalValue(key, value) {
  localStorage.setItem(key, value);
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
  const file = await fetch('assets/js/app.js');
  const content = await file.text();
  renderRankingEditor(readLocalJSON(DRAFT_KEYS.ranking, extractRanking(content)));
  showStatus('Ranking carregado.');
}

async function saveRanking() {
  const players = readRankingEditor();
  writeLocalValue(DRAFT_KEYS.ranking, JSON.stringify(players));
  renderRankingEditor(players);
  showStatus('Ranking salvo neste navegador.');
}

async function loadGuide() {
  const response = await fetch('index.html');
  const content = await response.text();
  guideEditor.value = localStorage.getItem(DRAFT_KEYS.guide) || extractBlock(content, 'GUIDE_EDITOR_START', 'GUIDE_EDITOR_END').body;
  htmlEditor.value = localStorage.getItem(DRAFT_KEYS.html) || content;
  showStatus('Guias carregados.');
}

async function saveGuide() {
  writeLocalValue(DRAFT_KEYS.guide, guideEditor.value.trim());
  showStatus('Guias salvos neste navegador.');
}

async function loadYoutube() {
  const response = await fetch('assets/js/config.js');
  const content = await response.text();
  const match = content.match(/youtubeApiKey:\s*(['"])([\s\S]*?)\1/);
  youtubeApiKeyInput.value = localStorage.getItem(DRAFT_KEYS.youtube) || (match ? match[2] : '');
  showStatus('Chave do YouTube carregada.');
}

async function saveYoutube() {
  writeLocalValue(DRAFT_KEYS.youtube, youtubeApiKeyInput.value.trim());
  showStatus('Chave do YouTube salva neste navegador.');
}

async function loadHtml() {
  const response = await fetch('index.html');
  const content = await response.text();
  htmlEditor.value = localStorage.getItem(DRAFT_KEYS.html) || content;
  guideEditor.value = localStorage.getItem(DRAFT_KEYS.guide) || extractBlock(content, 'GUIDE_EDITOR_START', 'GUIDE_EDITOR_END').body;
  showStatus('HTML bruto carregado.');
}

async function saveHtml() {
  writeLocalValue(DRAFT_KEYS.html, htmlEditor.value);
  showStatus('HTML bruto salvo neste navegador.');
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    showStatus('Informe email e senha.', 'error');
    return;
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    showStatus('Email ou senha incorretos.', 'error');
    return;
  }

  setLoggedIn(true);

  try {
    await Promise.all([loadRanking(), loadGuide(), loadYoutube(), loadHtml()]);
  } catch (error) {
    showStatus(error.message, 'error');
  }
});

logoutButton.addEventListener('click', () => {
  emailInput.value = '';
  passwordInput.value = '';
  guideEditor.value = '';
  youtubeApiKeyInput.value = '';
  htmlEditor.value = '';
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
document.getElementById('loadGuideButton').addEventListener('click', () => loadGuide().catch(error => showStatus(error.message, 'error')));
document.getElementById('saveGuideButton').addEventListener('click', () => saveGuide().catch(error => showStatus(error.message, 'error')));
document.getElementById('loadYoutubeButton').addEventListener('click', () => loadYoutube().catch(error => showStatus(error.message, 'error')));
document.getElementById('saveYoutubeButton').addEventListener('click', () => saveYoutube().catch(error => showStatus(error.message, 'error')));
document.getElementById('loadHtmlButton').addEventListener('click', () => loadHtml().catch(error => showStatus(error.message, 'error')));
document.getElementById('saveHtmlButton').addEventListener('click', () => saveHtml().catch(error => showStatus(error.message, 'error')));

if (localStorage.getItem(DRAFT_KEYS.ranking) || localStorage.getItem(DRAFT_KEYS.guide) || localStorage.getItem(DRAFT_KEYS.youtube) || localStorage.getItem(DRAFT_KEYS.html)) {
  showStatus('Rascunhos locais encontrados neste navegador.');
}
