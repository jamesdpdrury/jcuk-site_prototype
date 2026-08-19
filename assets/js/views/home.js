
const HomeView = {
  async render() {
    const specialOneOffsPlaylistName = "Special One Off's";
    const ridePovPlaylistName = 'Ride POV';
    const fireworksShowsPlaylistName = 'Fireworks and Shows';
    const specialOneOffsNormalized = specialOneOffsPlaylistName.toLowerCase();
    const ridePovNormalized = ridePovPlaylistName.toLowerCase();
    const fireworksShowsNormalized = fireworksShowsPlaylistName.toLowerCase();
    const specialPlaylistPageSize = 6;

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

    const normalizeList = (value) => {
      if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
      if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
      return [];
    };

    const slugifyPlaylist = (value) => String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const isRidePovVideo = (video) => {
      const playlistName = String(video?.playlist || '').trim().toLowerCase();
      if (playlistName === ridePovNormalized) return true;
      const tags = normalizeList(video?.tags).map(tag => tag.toLowerCase());
      return tags.includes(ridePovNormalized);
    };

    const isSpecialOneOffVideo = (video) => {
      const playlistName = String(video?.playlist || '').trim().toLowerCase();
      if (playlistName === specialOneOffsNormalized) return true;
      const tags = normalizeList(video?.tags).map(tag => tag.toLowerCase());
      return tags.includes(specialOneOffsNormalized);
    };

    const isFireworksShowsVideo = (video) => {
      const playlistName = String(video?.playlist || '').trim().toLowerCase();
      if (playlistName === fireworksShowsNormalized) return true;
      const tags = normalizeList(video?.tags).map(tag => tag.toLowerCase());
      return tags.includes(fireworksShowsNormalized);
    };

    const sortSpecialPlaylistVideos = (videos) => videos.sort((a, b) => {
      const dateDiff = getPublishTime(b?.published) - getPublishTime(a?.published);
      if (dateDiff !== 0) return dateDiff;
      const titleA = String(a?.title || '').trim();
      const titleB = String(b?.title || '').trim();
      return titleA.localeCompare(titleB);
    });

    const specialOneOffVideos = sortSpecialPlaylistVideos(safeItems.filter(isSpecialOneOffVideo));
    const ridePovVideos = sortSpecialPlaylistVideos(safeItems.filter(isRidePovVideo));
    const fireworksShowsVideos = sortSpecialPlaylistVideos(safeItems.filter(isFireworksShowsVideo));

    const renderSpecialPlaylistCard = (video, fallbackAltText, options = {}) => {
      const { includeCruiseLogo = false } = options;
      const slug = (video.slug || '').trim();
      const thumb = (video.thumbnail && video.thumbnail.trim())
        ? video.thumbnail
        : `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

      const parkLogos = Array.isArray(video.parkName)
        ? [...new Set(video.parkName)]
            .map((park) => {
              const logo = settings.logos?.parkName?.[park];
              if (!logo) return '';
              return `<img src="${logo}" alt="${escapeHtml(park)}" class="card-logo">`;
            })
            .filter(Boolean)
            .join('')
        : '';

      const cruiseLogo = includeCruiseLogo
        ? (settings.logos?.brand?.[video.brand] || '')
        : '';

      const combinedLogos = `${cruiseLogo ? `<img src="${cruiseLogo}" alt="${escapeHtml(video.brand || 'Cruise line')}" class="card-logo">` : ''}${parkLogos}`;

      return `
        <article class="card ride-pov-card">
          <a href="/v/${slug}" data-link style="display: block; text-decoration: none;">
            <img
              src="${thumb}"
              alt="${escapeHtml(video.title || fallbackAltText)}"
              loading="lazy"
              style="display: block; width: 100%; height: auto; cursor: pointer; border-radius: 10px 10px 0 0;"
              onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg';">
          </a>
          <div class="card-body">
            <div class="ride-pov-meta-row">
              ${combinedLogos ? `<div class="card-logos ride-pov-logos">${combinedLogos}</div>` : '<div class="ride-pov-logos-empty"></div>'}
              <div class="card-stats" data-video-id="${video.youtubeId || ''}">Loading stats…</div>
              <a class="btn" href="/v/${slug}" data-link>WATCH</a>
            </div>
          </div>
        </article>
      `;
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
      .filter(([name]) => {
        const normalizedName = String(name || '').trim().toLowerCase();
        return (
          name !== currentPlaylist
          && normalizedName !== specialOneOffsNormalized
          && normalizedName !== ridePovNormalized
          && normalizedName !== fireworksShowsNormalized
          && allPlaylists[name]?.show !== false
        );
      })
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

    // Build Ride POV videos section (excluded from Other Playlists cards)
    const ridePovHTML = `
      <section class="playlists-section ride-pov-section">
        <h2>Ride POVs</h2>
        ${ridePovVideos.length > 0 ? `
          <div id="ride-pov-grid" class="grid"></div>
          <div class="ride-pov-actions">
            <button id="ride-pov-show-more" class="btn ride-pov-show-more" type="button">Show more</button>
          </div>
        ` : '<p class="hint">No Ride POV videos yet.</p>'}
      </section>
    `;

    const specialOneOffsHTML = `
      <section class="playlists-section ride-pov-section special-one-offs-section">
        <h2>Special One Off's</h2>
        ${specialOneOffVideos.length > 0 ? `
          <div id="special-one-offs-grid" class="grid"></div>
          <div class="ride-pov-actions">
            <button id="special-one-offs-show-more" class="btn ride-pov-show-more" type="button">Show more</button>
          </div>
        ` : '<p class="hint">No Special One Off\'s videos yet.</p>'}
      </section>
    `;

    const fireworksShowsHTML = `
      <section class="playlists-section ride-pov-section fireworks-shows-section">
        <h2>Fireworks and Shows</h2>
        ${fireworksShowsVideos.length > 0 ? `
          <div id="fireworks-shows-grid" class="grid"></div>
          <div class="ride-pov-actions">
            <button id="fireworks-shows-show-more" class="btn ride-pov-show-more" type="button">Show more</button>
          </div>
        ` : '<p class="hint">No Fireworks and Shows videos yet.</p>'}
      </section>
    `;

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
        ${specialOneOffsHTML}
        ${ridePovHTML}
        ${fireworksShowsHTML}
        ${cruiseLinesHTML}
        ${theparksHTML}
      </main>
    `;
    
    // Add playlist click handlers
    const playlistCards = app.querySelectorAll('.playlist-card');
    const getHeaderOffset = () => {
      const header = document.querySelector('.main-header');
      if (header && header.offsetHeight) return header.offsetHeight;
      return window.innerWidth <= 768 ? 215 : 162;
    };

    playlistCards.forEach(card => {
      card.addEventListener('click', async () => {
        const playlistName = card.getAttribute('data-playlist-name');
        const playlistVideos = safeItems.filter(v => (v.playlist || '').trim() === playlistName);
        const detailDiv = document.getElementById('playlist-detail');
        const restoreScrollTop = () => {
          const savedTop = Number(detailDiv.dataset.restoreScroll || '0');
          if (Number.isFinite(savedTop)) {
            window.scrollTo({ top: Math.max(0, savedTop), behavior: 'smooth' });
            delete detailDiv.dataset.restoreScroll;
          }
        };
        
        if (detailDiv.classList.contains('active') && detailDiv.getAttribute('data-playlist') === playlistName) {
          // Close if already open
          detailDiv.classList.remove('active');
          detailDiv.innerHTML = '';
          restoreScrollTop();
          return;
        }

        const headerOffset = getHeaderOffset();
        detailDiv.dataset.restoreScroll = String(Math.max(0, window.scrollY + card.getBoundingClientRect().top - headerOffset));
        
        // Show playlist videos
        const playlistSlug = slugifyPlaylist(playlistName);
        detailDiv.innerHTML = `
          <div class="playlist-detail-header">
            <h3>${playlistName}</h3>
            <div class="playlist-detail-actions">
              <a class="btn" href="/p/${encodeURIComponent(playlistSlug)}" data-link>WATCH PLAYLIST</a>
              <button class="btn-close-playlist">Close Playlist</button>
            </div>
          </div>
          <div class="grid">
            ${playlistVideos.map(v => VideoCard.render(v)).join('')}
          </div>
        `;
        detailDiv.setAttribute('data-playlist', playlistName);
        detailDiv.classList.add('active');
        VideoCard.hydrateStats();

        requestAnimationFrame(() => {
          const scrollTarget = detailDiv.getBoundingClientRect().top + window.scrollY - headerOffset;
          window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
        });
        
        // Close button handler
        const closeBtn = detailDiv.querySelector('.btn-close-playlist');
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          detailDiv.classList.remove('active');
          detailDiv.innerHTML = '';
          restoreScrollTop();
        });
      });
    });

    const initSpecialPlaylistSection = (gridId, buttonId, sourceVideos, fallbackAltText, options = {}) => {
      const grid = document.getElementById(gridId);
      const showMoreButton = document.getElementById(buttonId);
      if (!grid || !showMoreButton) return;

      let visibleCount = specialPlaylistPageSize;

      const renderChunk = () => {
        const visibleItems = sourceVideos.slice(0, visibleCount);
        grid.innerHTML = visibleItems.map(v => renderSpecialPlaylistCard(v, fallbackAltText, options)).join('');

        if (visibleCount >= sourceVideos.length) {
          showMoreButton.style.display = 'none';
        } else {
          showMoreButton.style.display = '';
        }

        VideoCard.hydrateStats();
      };

      showMoreButton.addEventListener('click', () => {
        visibleCount += specialPlaylistPageSize;
        renderChunk();
      });

      renderChunk();
    };

    initSpecialPlaylistSection('special-one-offs-grid', 'special-one-offs-show-more', specialOneOffVideos, 'Special One Off video');
    initSpecialPlaylistSection('ride-pov-grid', 'ride-pov-show-more', ridePovVideos, 'Ride POV video');
    initSpecialPlaylistSection('fireworks-shows-grid', 'fireworks-shows-show-more', fireworksShowsVideos, 'Fireworks and Shows video', { includeCruiseLogo: true });
    
    VideoCard.hydrateStats();
  }
};

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
