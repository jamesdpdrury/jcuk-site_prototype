
const HomeView = {
  async render() {
    const [items, settings] = await Promise.all([
      API.getContent(),
      API.getSettings()
    ]);
    const safeItems = Array.isArray(items) ? items : [];
    VideoCard.logoMap = settings.logos || {};

    // Get featured video
    const featured = safeItems.find(i => i.featured) || safeItems[0];
    if (!featured) {
      app.innerHTML = `
        ${Header()}
        <main class="container">
          <section class="section">
            <h1>No videos yet</h1>
            <p>Content will appear here once videos are available.</p>
          </section>
        </main>
      `;
      return;
    }
    const img = (featured.thumbnail && featured.thumbnail.trim()) ?
        featured.thumbnail :
        `https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`;
    const featuredSlug = (featured.slug || '').trim();

    // Get current playlist videos
    const currentPlaylist = settings.currentPlaylist || 'Virgin Voyages June 2026';
    const currentPlaylistVideos = safeItems.filter(v => (v.playlist || '').trim() === currentPlaylist);

    const getPublishTime = (value) => {
      if (!value) return 0;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    // Build playlist cards from visible content first so hidden playlists and future-only playlists stay excluded.
    const allPlaylists = settings.playlists || {};
    const visiblePlaylistEntries = safeItems.reduce((entries, video) => {
      const name = (video.playlist || '').trim();
      if (!name) return entries;

      const publishTime = getPublishTime(video.published);
      const currentEntry = entries[name];
      if (!currentEntry || publishTime > currentEntry.publishTime) {
        entries[name] = { video, publishTime };
      }
      return entries;
    }, {});

    const otherPlaylists = Object.entries(visiblePlaylistEntries)
      .filter(([name]) => name !== currentPlaylist && allPlaylists[name]?.show !== false)
      .map(([name, entry]) => {
        const newestVideo = entry.video;
        const playlistSettings = allPlaylists[name] || {};
        const videoCount = safeItems.filter(v => (v.playlist || '').trim() === name).length;
        const thumbnail = (playlistSettings.thumbnail || newestVideo?.thumbnail || '').trim()
          || `https://i.ytimg.com/vi/${newestVideo?.youtubeId}/hqdefault.jpg`;
        return { name, thumbnail, publishDate: entry.publishTime, videoCount };
      })
      .sort((a, b) => b.publishDate - a.publishDate || a.name.localeCompare(b.name));

    // Get unique cruise lines (brands)
    const cruiseLines = {};
    safeItems.forEach(v => {
      if (v.brand) {
        const key = v.brand.toLowerCase().replace(/\s+/g, '-');
        if (!cruiseLines[key]) {
          cruiseLines[key] = {
            name: v.brand,
            logo: (settings.logos?.brand?.[v.brand] || '').substring(0, 100),
            videoCount: 0
          };
        }
        cruiseLines[key].videoCount += 1;
      }
    });

    const sortedCruiseLines = Object.entries(cruiseLines)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    // Get unique theme parks (parkName is array)
    const themeparks = {};
    safeItems.forEach(v => {
      if (v.parkName && Array.isArray(v.parkName)) {
        v.parkName.forEach(park => {
          const key = park.toLowerCase().replace(/\s+/g, '-');
          if (!themeparks[key]) {
            themeparks[key] = {
              name: park,
              logo: (settings.logos?.parkName?.[park] || '').substring(0, 100),
              videoCount: 0
            };
          }
          themeparks[key].videoCount += 1;
        });
      }
    });

    const sortedThemeParks = Object.entries(themeparks)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    // Build current playlist section HTML
    const currentPlaylistHTML = currentPlaylistVideos.length > 0 ? `
      <section class="current-playlist-section">
        <h2><span style="color: #000;">Current Playlist: </span>${currentPlaylist}</h2>
        <div class="grid">
          ${currentPlaylistVideos.map(v => VideoCard.render(v)).join('')}
        </div>
      </section>
    ` : '';

    // Build other playlists grid
    const otherPlaylistsHTML = otherPlaylists.length > 0 ? `
      <section class="playlists-section">
        <h2>Other Playlists</h2>
        <div class="playlists-grid">
          ${otherPlaylists.map(({ name, thumbnail, videoCount }) => `
            <div class="playlist-card" data-playlist-name="${escapeHtml(name)}">
              <img src="${thumbnail}" alt="${name}" class="playlist-thumbnail">
              <div class="playlist-card-title">${name}</div>
              <div class="card-count-badge">${videoCount}</div>
            </div>
          `).join('')}
        </div>
        <div id="playlist-detail" class="playlist-detail"></div>
      </section>
    ` : '';

    // Build cruise lines grid
    const cruiseLinesHTML = sortedCruiseLines.length > 0 ? `
      <section class="filters-section">
        <h2>Cruise Lines</h2>
        <div class="filters-grid">
          ${sortedCruiseLines.map(([key, cruise]) => {
            const logoBase64 = settings.logos?.brand?.[cruise.name] || '';
            return `
              <a href="/cruise/${key}" data-link class="filter-card">
                ${logoBase64 ? `<img src="${logoBase64}" alt="${cruise.name}" class="filter-logo">` : `<div class="filter-label">${cruise.name}</div>`}
                <div class="card-count-badge">${cruise.videoCount}</div>
              </a>
            `;
          }).join('')}
        </div>
      </section>
    ` : '';

    // Build theme parks grid
    const theparksHTML = sortedThemeParks.length > 0 ? `
      <section class="filters-section">
        <h2>Theme Parks</h2>
        <div class="filters-grid">
          ${sortedThemeParks.map(([key, park]) => {
            const logoBase64 = settings.logos?.parkName?.[park.name] || '';
            return `
              <a href="/park/${key}" data-link class="filter-card">
                ${logoBase64 ? `<img src="${logoBase64}" alt="${park.name}" class="filter-logo">` : `<div class="filter-label">${park.name}</div>`}
                <div class="card-count-badge">${park.videoCount}</div>
              </a>
            `;
          }).join('')}
        </div>
      </section>
    ` : '';

    app.innerHTML = `
      ${Header()}
      <main class="container">
        <section class="hero">
          <div class="hero-container">
            <a style="cursor: pointer; text-decoration: none;" href="/v/${featuredSlug}" data-link>
              <img class="hero-image"
                   src="${img}"
                   alt="${featured.title}"
                   style="display: block; width: 100%; max-width: 100%; border-radius: 18px; overflow: hidden; object-fit: cover; aspect-ratio: 16/9;"
                   onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${featured.youtubeId}/hqdefault.jpg';">
            </a>
            <div class="featured-sticker">Featured Video</div>
          </div>
          <h1>${featured.title}</h1>
          <p>${featured.summary || ""}</p>
          <a class="btn" href="/v/${featuredSlug}" data-link>WATCH</a>
        </section>

        ${currentPlaylistHTML}
        ${otherPlaylistsHTML}
        ${cruiseLinesHTML}
        ${theparksHTML}
      </main>
    `;
    
    // Add playlist click handlers
    const playlistCards = app.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
      card.addEventListener('click', async () => {
        const playlistName = card.getAttribute('data-playlist-name');
        const playlistVideos = safeItems.filter(v => (v.playlist || '').trim() === playlistName);
        const detailDiv = document.getElementById('playlist-detail');
        
        if (detailDiv.classList.contains('active') && detailDiv.getAttribute('data-playlist') === playlistName) {
          // Close if already open
          detailDiv.classList.remove('active');
          detailDiv.innerHTML = '';
          return;
        }
        
        // Show playlist videos
        detailDiv.innerHTML = `
          <div class="playlist-detail-header">
            <h3>${playlistName}</h3>
            <button class="btn-close-playlist">Close Playlist</button>
          </div>
          <div class="grid">
            ${playlistVideos.map(v => VideoCard.render(v)).join('')}
          </div>
        `;
        detailDiv.setAttribute('data-playlist', playlistName);
        detailDiv.classList.add('active');
        VideoCard.hydrateStats();
        
        // Close button handler
        const closeBtn = detailDiv.querySelector('.btn-close-playlist');
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          detailDiv.classList.remove('active');
          detailDiv.innerHTML = '';
        });
      });
    });
    
    VideoCard.hydrateStats();
  }
};

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
