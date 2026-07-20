
const HomeView={
 async render(){
  const items=await API.getContent();
  const settings=await API.getSettings();
  VideoCard.logoMap=settings.logos||{};
  
  const featured=items.find(i=>i.featured)||items[0];
  const img=(featured.thumbnail&&featured.thumbnail.trim())?
      featured.thumbnail:
      `https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`;
  const featuredSlug=(featured.slug||'').trim();

  // Group videos by playlist and sort playlists by newest video
  const playlistGroups = {};
  items.forEach(item => {
    const playlist = (item.playlist || 'Other').trim();
    if (!playlistGroups[playlist]) {
      playlistGroups[playlist] = [];
    }
    playlistGroups[playlist].push(item);
  });

  // Sort playlists by newest video date
  const sortedPlaylists = Object.entries(playlistGroups)
    .sort((a, b) => {
      const newestA = new Date(Math.max(...a[1].map(v => new Date(v.published || 0))));
      const newestB = new Date(Math.max(...b[1].map(v => new Date(v.published || 0))));
      return newestB - newestA;
    });

  const playlistHTML = sortedPlaylists.map(([playlist, videos]) => `
    <section class="playlist-section">
      <h2 class="playlist-title">${playlist}</h2>
      <div class="grid">
        ${videos.map(v=>VideoCard.render(v)).join("")}
      </div>
    </section>
  `).join("");

  app.innerHTML=`
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
        <p>${featured.summary||""}</p>
        <a class="btn" href="/v/${featuredSlug}" data-link>WATCH</a>
      </section>

      ${playlistHTML}
    </main>
  `;
  VideoCard.hydrateStats();
 }
};
