const CalendarView = {
  async render() {
    const items = await API.getContent();
    const settings = await API.getSettings();
    VideoCard.logoMap = settings.logos || {};

    // Group videos by published date
    const videosByDate = {};
    items.forEach(video => {
      if (video.published) {
        const date = video.published.split('T')[0]; // YYYY-MM-DD
        if (!videosByDate[date]) {
          videosByDate[date] = [];
        }
        videosByDate[date].push(video);
      }
    });

    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Generate calendar
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    let calendarHTML = '<div class="calendar-container">';
    calendarHTML += `<div class="calendar-header">
      <h2 class="calendar-month">${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay)}</h2>
    </div>`;

    // Day headers
    calendarHTML += '<div class="calendar-grid">';
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarHTML += '<div class="calendar-empty"></div>';
    }

    // Days with videos
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const videosOnDate = videosByDate[dateStr] || [];

      calendarHTML += '<div class="calendar-day">';
      calendarHTML += `<div class="calendar-day-number">${day}</div>`;

      if (videosOnDate.length > 0) {
        calendarHTML += '<div class="calendar-day-videos">';
        videosOnDate.forEach(video => {
          const thumb = video.thumbnail && video.thumbnail.trim()
            ? video.thumbnail
            : `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`;
          const slug = (video.slug || '').trim();
          calendarHTML += `
            <a href="/v/${slug}" data-link class="calendar-video-item" style="text-decoration: none;">
              <img src="${thumb}" alt="${video.title}" class="calendar-video-thumb" style="width: 100%; height: 100%; object-fit: cover;">
              <div class="calendar-video-popup">
                <h4>${video.title}</h4>
                <p>${video.summary || ''}</p>
              </div>
            </a>
          `;
        });
        calendarHTML += '</div>';
      }

      calendarHTML += '</div>';
    }

    calendarHTML += '</div></div>';

    app.innerHTML = `
      ${Header()}
      <main class="container">
        <section class="calendar-section">
          <h1>Video Calendar</h1>
          <p>Click on a video to watch it. Videos are published on the dates shown below.</p>
          ${calendarHTML}
        </section>
      </main>
    `;
    VideoCard.hydrateStats();
  }
};
