const pages = document.querySelectorAll('.page');
    const pageLinks = document.querySelectorAll('[data-page-link]');
    const navLinks = document.querySelectorAll('.nav-link');
    const navMenu = document.getElementById('navLinks');
    const menuToggle = document.getElementById('menuToggle');

    function openPage(pageId, updateHash = true) {
      const target = document.getElementById(pageId);

      if (!target) return;

      pages.forEach(page => page.classList.remove('active'));
      target.classList.add('active');

      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.pageLink === pageId);
      });

      navMenu.classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (updateHash) {
        history.replaceState(null, '', '#' + pageId);
      }
    }

    pageLinks.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        openPage(link.dataset.pageLink);
      });
    });

    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    document.querySelectorAll('.accordion-button').forEach(button => {
      button.addEventListener('click', () => {
        button.closest('.accordion-item').classList.toggle('open');
      });
    });

    function readDraftJSON(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (error) {
        return fallback;
      }
    }

    function applyGuideDraft() {
      const draft = localStorage.getItem('killersbr_draft_guide');
      const target = document.querySelector('#guia .guide-layout .accordion');

      if (draft && target) {
        target.outerHTML = draft;
      }
    }

    applyGuideDraft();

    /*
      RANKING MANUAL
      Edite, adicione ou remova jogadores abaixo.
      O ranking respeita a ordem do array.
    */
    const defaultRankingPlayers = [
      { name: '-RAGN4R-', characterClass: 'MAGIC STR' },
      { name: '-BJORN-', characterClass: 'MAGIC WIZ' },
      { name: 'DOOKI.', characterClass: 'SUMMONER' },
      { name: 'RAZVOK.', characterClass: 'MAGIC STR' },
      { name: 'GHOSTZ.', characterClass: 'MAGIC STR' },
      { name: 'GWYNETH.', characterClass: 'MAGIC STR' },
      { name: 'QUEEN_YAMA.', characterClass: 'SUMMONER' },
      { name: 'SUTAN.', characterClass: 'MAGIC STR' },
      { name: 'CREATVSEST.', characterClass: 'MAGIC WIZ' },
      { name: '-HOLLYWOOD-', characterClass: 'MAGIC STR' },
      { name: 'NOBUDGET.', characterClass: 'BLADE KNIGHT' },
      { name: 'BRUJA.', characterClass: 'ELF' },
      { name: 'HUGOBAKER.', characterClass: 'MAGIC STR' },
      { name: 'HUGOBAKER.', characterClass: 'MAGIC STR' },
      { name: 'SAGAZ.', characterClass: 'DARK WIZARD' },
      { name: 'FREYA.', characterClass: 'SUMMONER' },
      { name: 'GUIZAO.', characterClass: 'BLADE KNIGHT' }
    ];
    const rankingPlayers = readDraftJSON('killersbr_draft_ranking', defaultRankingPlayers);

    function renderRanking() {
      const body = document.getElementById('rankingBody');

      body.innerHTML = rankingPlayers.map((player, index) => `
        <tr>
          <td><div class="position">${index + 1}</div></td>
          <td>
            <div class="player">
              <div class="avatar">${player.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>${player.name}</strong>
                <small>Killers BR</small>
              </div>
            </div>
          </td>
          <td>${player.characterClass}</td>
          <td><strong>KILLERSBR.BRASIL</strong></td>
          <td>
            <span class="status">Guild</span>
          </td>
        </tr>
      `).join('');
    }

    

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    const initialPage = location.hash.replace('#', '');
    openPage(document.getElementById(initialPage) ? initialPage : 'home', false);

    renderRanking();

  

const YOUTUBE_HANDLE = 'KILLERSBR.BRASIL';
const YOUTUBE_API_KEY = localStorage.getItem('killersbr_draft_youtube_api_key') || window.KILLERSBR_CONFIG?.youtubeApiKey || '';
const fallbackVideos = [
  { id:'7j1tviRi8Rg', title:'TRICAMPEÃO DA CASTLE SIEGE.', description:'Conteúdo do canal KILLERSBR.BRASIL.' },
  { id:'IiOF79m86X4', title:'EP-4: CRYWOLF. CHOSEN VS KILLERSBR.', description:'Batalha da guild no evento Crywolf.' },
  { id:'m4xBTyNkr44', title:'Ep-3: EVENTO CRYWOLF. Chosen wins', description:'Mais um episódio dos eventos da guild.' },
  { id:'sz2EAPrBffg', title:'CRYSTAL MINE. PVP', description:'PVP e ação no mapa Crystal Mine.' },
  { id:'4NL-FjdmQDg', title:'SAIBA COMO SUBIR SEU STATUS.', description:'Guia para evolução do personagem.' },
  { id:'Gei7Z2Eh588', title:'Fight ROLANDO NA CM. KILLERSBR VS FATASMA.', description:'Confronto da guild na Crystal Mine.' }
];

function normalizeVideo(item) {
  const snippet = item.snippet || {};
  return {
    id: snippet.resourceId?.videoId || item.id?.videoId || item.id,
    title: snippet.title || item.title || 'Vídeo KILLERSBR.BRASIL',
    description: snippet.description || item.description || '',
    thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${snippet.resourceId?.videoId || item.id}/hqdefault.jpg`,
    publishedAt: snippet.publishedAt || item.publishedAt || '',
    isLive: Boolean(snippet.liveBroadcastContent === 'live' || item.isLive),
    url: `https://www.youtube.com/watch?v=${snippet.resourceId?.videoId || item.id?.videoId || item.id}`
  };
}

async function fetchJson(url, message) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(message);
  }

  return response.json();
}

async function fetchChannelData() {
  const channelData = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(YOUTUBE_HANDLE)}&key=${YOUTUBE_API_KEY}`,
    'Falha ao localizar o canal'
  );

  const channel = channelData.items?.[0];
  if (!channel) {
    throw new Error('Canal do YouTube não encontrado');
  }

  return {
    channelId: channel.id,
    uploadsId: channel.contentDetails?.relatedPlaylists?.uploads
  };
}

async function fetchAllPlaylistVideos(uploadsId) {
  const items = [];
  let nextPageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId: uploadsId,
      maxResults: '50',
      key: YOUTUBE_API_KEY
    });

    if (nextPageToken) {
      params.set('pageToken', nextPageToken);
    }

    const pageData = await fetchJson(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
      'Falha ao carregar os vídeos'
    );

    items.push(...(pageData.items || []));
    nextPageToken = pageData.nextPageToken || '';
  } while (nextPageToken);

  return items.map(normalizeVideo).filter(video => video.id && video.title !== 'Private video' && video.title !== 'Deleted video');
}

async function fetchLiveVideo(channelId) {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    eventType: 'live',
    type: 'video',
    maxResults: '1',
    order: 'date',
    key: YOUTUBE_API_KEY
  });

  const liveData = await fetchJson(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    'Falha ao verificar live'
  );

  const liveItem = liveData.items?.[0];
  return liveItem ? normalizeVideo({ ...liveItem, isLive: true }) : null;
}

function dedupeVideos(videos) {
  const seen = new Set();
  return videos.filter(video => {
    if (!video.id || seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

async function loadYouTubeVideos() {
  const status = document.getElementById('apiStatus');
  try {
    if (!YOUTUBE_API_KEY) throw new Error('API_KEY_NOT_CONFIGURED');
    const { channelId, uploadsId } = await fetchChannelData();
    if (!uploadsId) throw new Error('Playlist de uploads não encontrada');

    const [playlistVideos, liveVideo] = await Promise.all([
      fetchAllPlaylistVideos(uploadsId),
      fetchLiveVideo(channelId)
    ]);

    const videos = dedupeVideos(liveVideo ? [liveVideo, ...playlistVideos] : playlistVideos);
    if (!videos.length) throw new Error('Nenhum vídeo retornado');

    status.textContent = liveVideo
      ? `Ao vivo agora no canal. ${playlistVideos.length} vídeos carregados da biblioteca.`
      : `${playlistVideos.length} vídeos carregados automaticamente pela API do YouTube.`;
    renderVideoShowcase(videos, { hasLive: Boolean(liveVideo) });
  } catch (error) {
    status.textContent = error.message === 'API_KEY_NOT_CONFIGURED'
      ? 'Exibindo vídeos de reserva. Configure a chave da API para atualização automática.'
      : 'A API não respondeu. Exibindo vídeos de reserva.';
    renderVideoShowcase(fallbackVideos.map(normalizeVideo), { hasLive: false });
  }
}

function renderVideoShowcase(videos, options = {}) {
  const { hasLive = false } = options;
  const rail = document.getElementById('videoRail');
  rail.innerHTML = videos.map((video, index) => `
    <article class="card video-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
      ${video.isLive ? '<span class="video-badge video-badge-live">AO VIVO</span>' : ''}
      <img src="${video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}" alt="${video.title}" loading="lazy">
      <div class="video-info">
        <h3>${video.title}</h3>
        <p>${video.isLive ? 'Transmissão em andamento' : 'Vídeo do canal oficial'}</p>
      </div>
    </article>
  `).join('');

  function selectVideo(index) {
    const video = videos[index];
    const featuredBadge = document.getElementById('featuredBadge');
    document.getElementById('featuredPlayer').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${video.id}${video.isLive ? '?autoplay=1' : ''}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    document.getElementById('featuredTitle').textContent = video.title;
    document.getElementById('featuredDescription').textContent = video.description || 'Assista a este conteúdo no canal oficial da guild.';
    if (featuredBadge) {
      featuredBadge.textContent = video.isLive ? 'AO VIVO' : hasLive ? 'BIBLIOTECA' : 'DESTAQUE';
      featuredBadge.className = `video-badge${video.isLive ? ' video-badge-live' : ''}`;
    }
    document.querySelector('.featured-video')?.classList.toggle('is-live', video.isLive);
    document.querySelectorAll('.video-thumb').forEach((card, cardIndex) => card.classList.toggle('active', cardIndex === index));
  }

  rail.querySelectorAll('.video-thumb').forEach(card => card.addEventListener('click', () => selectVideo(Number(card.dataset.index))));
  selectVideo(0);
}

document.getElementById('videosPrev')?.addEventListener('click', () => document.getElementById('videoRail').scrollBy({ left:-540, behavior:'smooth' }));
document.getElementById('videosNext')?.addEventListener('click', () => document.getElementById('videoRail').scrollBy({ left:540, behavior:'smooth' }));
loadYouTubeVideos();

window.addEventListener('storage', event => {
  if ([
    'killersbr_draft_ranking',
    'killersbr_draft_guide',
    'killersbr_draft_youtube_api_key'
  ].includes(event.key)) {
    window.location.reload();
  }
});
