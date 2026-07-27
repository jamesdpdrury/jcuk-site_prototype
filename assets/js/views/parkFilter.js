const ParkFilterView = {
  async render(parkName) {
    const items = await API.getContent();
    const settings = await API.getSettings();
    VideoCard.logoMap = settings.logos || {};

    // Decode the park name from URL (replace hyphens with spaces) and capitalize
    const displayName = decodeURIComponent(parkName).replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Filter videos by theme park (parkName is an array)
    const filteredItems = items.filter(item => 
      item.parkName && Array.isArray(item.parkName) && 
      item.parkName.some(park => park.toLowerCase() === displayName.toLowerCase())
    );

    const html = `
      ${Header()}
      <main class="container">
        <h1>${displayName}</h1>
        <div class="grid">
          ${filteredItems.map(v => VideoCard.render(v)).join('')}
        </div>
      </main>
    `;

    document.getElementById('app').innerHTML = html;
    VideoCard.hydrateStats();
  }
};
