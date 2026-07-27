
const HomeView = {
  async render() {
    const items = await API.getContent();
    const settings = await API.getSettings();
    VideoCard.logoMap = settings.logos || {};

    // Get featured video
    const featured = items.find(i => i.featured) || items[0];
    const img = (featured.thumbnail && featured.thumbnail.trim()) ?
        featured.thumbnail :
        `https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`;
    const featuredSlug = (featured.slug || '').trim();

    // Get current playlist videos
    const currentPlaylist = settings.currentPlaylist || 'Virgin Voyages June 2026';
    const currentPlaylistVideos = items.filter(v => (v.playlist || '').trim() === currentPlaylist);

    // Get all unique playlists except current
    const allPlaylists = settings.playlists || {};
    const otherPlaylists = Object.entries(allPlaylists).filter(
      ([name]) => name !== currentPlaylist
    );

    // Get unique cruise lines (brands)
    const cruiseLines = {};
    items.forEach(v => {
      if (v.brand) {
        const key = v.brand.toLowerCase().replace(/\s+/g, '-');
        if (!cruiseLines[key]) {
          cruiseLines[key] = {
            name: v.brand,
            logo: (settings.logos?.brand?.[v.brand] || '').substring(0, 100)
          };
        }
      }
    });

    // Get unique theme parks (parkName is array)
    const themeparks = {};
    items.forEach(v => {
      if (v.parkName && Array.isArray(v.parkName)) {
        v.parkName.forEach(park => {
          const key = park.toLowerCase().replace(/\s+/g, '-');
          if (!themeparks[key]) {
            themeparks[key] = {
              name: park,
              logo: (settings.logos?.parkName?.[park] || '').substring(0, 100)
            };
          }
        });
      }
    });

    // Build current playlist section HTML
    const currentPlaylistHTML = currentPlaylistVideos.length > 0 ? `
      <section class="current-playlist-section">
        <h2>${currentPlaylist}</h2>
        <div class="grid">
          ${currentPlaylistVideos.map(v => VideoCard.render(v)).join('')}
        </div>
      </section>
    ` : '';

    // Build other playlists grid
    const otherPlaylistsHTML = otherPlaylists.length > 0 ? `
      <section class="playlists-section">
        <h2>All Playlists</h2>
        <div class="playlists-grid">
          ${otherPlaylists.map(([name, data]) => `
            <a href="/videos?playlist=${encodeURIComponent(name)}" data-link class="playlist-card">
              <img src="${data.thumbnail}" alt="${name}" class="playlist-thumbnail">
              <div class="playlist-card-title">${name}</div>
            </a>
          `).join('')}
        </div>
      </section>
    ` : '';

    // Build cruise lines grid
    const cruiseLinesHTML = Object.keys(cruiseLines).length > 0 ? `
      <section class="filters-section">
        <h2>Cruise Lines</h2>
        <div class="filters-grid">
          ${Object.entries(cruiseLines).map(([key, cruise]) => {
            const logoBase64 = settings.logos?.brand?.[cruise.name] || '';
            return `
              <a href="/cruise/${key}" data-link class="filter-card">
                ${logoBase64 ? `<img src="${logoBase64}" alt="${cruise.name}" class="filter-logo">` : `<div class="filter-label">${cruise.name}</div>`}
              </a>
            `;
          }).join('')}
        </div>
      </section>
    ` : '';

    // Build theme parks grid
    const theparksHTML = Object.keys(themeparks).length > 0 ? `
      <section class="filters-section">
        <h2>Theme Parks</h2>
        <div class="filters-grid">
          ${Object.entries(themeparks).map(([key, park]) => {
            const logoBase64 = settings.logos?.parkName?.[park.name] || '';
            return `
              <a href="/park/${key}" data-link class="filter-card">
                ${logoBase64 ? `<img src="${logoBase64}" alt="${park.name}" class="filter-logo">` : `<div class="filter-label">${park.name}</div>`}
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
    VideoCard.hydrateStats();
  }
};
