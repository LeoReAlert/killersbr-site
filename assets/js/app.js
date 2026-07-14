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

    /*
      RANKING MANUAL
      Edite, adicione ou remova jogadores abaixo.
      O ranking respeita a ordem do array.
    */
    const rankingPlayers = [
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
const YOUTUBE_API_KEY = window.KILLERSBR_CONFIG?.youtubeApiKey || '';
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
    thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${snippet.resourceId?.videoId || item.id}/hqdefault.jpg`
  };
}

async function loadYouTubeVideos() {
  const status = document.getElementById('apiStatus');
  try {
    if (!YOUTUBE_API_KEY) throw new Error('API_KEY_NOT_CONFIGURED');
    const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(YOUTUBE_HANDLE)}&key=${YOUTUBE_API_KEY}`);
    if (!channelResponse.ok) throw new Error('Falha ao localizar o canal');
    const channelData = await channelResponse.json();
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error('Playlist de uploads não encontrada');
    const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=20&key=${YOUTUBE_API_KEY}`);
    if (!videosResponse.ok) throw new Error('Falha ao carregar os vídeos');
    const videosData = await videosResponse.json();
    const videos = (videosData.items || []).map(normalizeVideo).filter(video => video.id && video.title !== 'Private video' && video.title !== 'Deleted video');
    if (!videos.length) throw new Error('Nenhum vídeo retornado');
    status.textContent = 'Vídeos atualizados automaticamente pela API do YouTube.';
    renderVideoShowcase(videos);
  } catch (error) {
    status.textContent = error.message === 'API_KEY_NOT_CONFIGURED'
      ? 'Exibindo vídeos de reserva. Configure a chave da API para atualização automática.'
      : 'A API não respondeu. Exibindo vídeos de reserva.';
    renderVideoShowcase(fallbackVideos.map(normalizeVideo));
  }
}

function renderVideoShowcase(videos) {
  const rail = document.getElementById('videoRail');
  rail.innerHTML = videos.map((video, index) => `
    <article class="card video-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}" alt="${video.title}" loading="lazy">
      <div class="video-info"><h3>${video.title}</h3></div>
    </article>
  `).join('');

  function selectVideo(index) {
    const video = videos[index];
    document.getElementById('featuredPlayer').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${video.id}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    document.getElementById('featuredTitle').textContent = video.title;
    document.getElementById('featuredDescription').textContent = video.description || 'Assista a este conteúdo no canal oficial da guild.';
    document.querySelectorAll('.video-thumb').forEach((card, cardIndex) => card.classList.toggle('active', cardIndex === index));
  }

  rail.querySelectorAll('.video-thumb').forEach(card => card.addEventListener('click', () => selectVideo(Number(card.dataset.index))));
  selectVideo(0);
}

document.getElementById('videosPrev')?.addEventListener('click', () => document.getElementById('videoRail').scrollBy({ left:-540, behavior:'smooth' }));
document.getElementById('videosNext')?.addEventListener('click', () => document.getElementById('videoRail').scrollBy({ left:540, behavior:'smooth' }));
loadYouTubeVideos();
