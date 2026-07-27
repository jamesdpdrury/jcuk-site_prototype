const CruiseFilterView = {
  async render(cruiseName) {
    const items = await API.getContent();
    const settings = await API.getSettings();
    VideoCard.logoMap = settings.logos || {};

    // Decode the cruise name from URL (replace hyphens with spaces) and capitalize
    const displayName = decodeURIComponent(cruiseName).replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Filter videos by cruise line (brand)
    const filteredItems = items.filter(item => 
      item.brand && item.brand.toLowerCase() === displayName.toLowerCase()
    );

    const html = `
      ${Header()}
      <main class="container">
        <h1>${displayName} Videos</h1>
        <div class="grid">
          ${filteredItems.map(v => VideoCard.render(v)).join('')}
        </div>
      </main>
    `;

    document.getElementById('app').innerHTML = html;
    VideoCard.hydrateStats();
  }
};
