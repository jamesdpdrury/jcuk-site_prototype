const CruiseFilterView = {
  async render(cruiseName) {
    const items = await API.getContent();
    const settings = await API.getSettings();
    VideoCard.logoMap = settings.logos || {};

    // Decode the cruise name from URL (replace hyphens with spaces)
    const displayName = decodeURIComponent(cruiseName).replace(/-/g, ' ');

    // Filter videos by cruise line (brand)
    const filteredItems = items.filter(item => 
      item.brand && item.brand.toLowerCase() === displayName.toLowerCase()
    );

    const html = `
      <div class="container">
        <h1>${displayName} Videos</h1>
        <div class="videos-grid">
          ${filteredItems.map(v => VideoCard.render(v)).join('')}
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
    VideoCard.hydrateStats();
  }
};
