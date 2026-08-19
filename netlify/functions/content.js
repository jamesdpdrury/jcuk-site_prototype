const fs = require('fs');
const path = require('path');

function getPublishTime(dateString) {
  if (!dateString) return null;
  const value = String(dateString).trim();
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (dateOnlyMatch) {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      return Date.UTC(year, month, day, 0, 1, 0, 0);
    }
    return date.getTime();
  } catch {
    return null;
  }
}

async function isYouTubePublic(video) {
  const youtubeId = String(video?.youtubeId || '').trim();
  if (!youtubeId) return true;

  const apiKey = process.env.YOUTUBE_API_KEY || '';
  if (!apiKey) return false;

  const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${encodeURIComponent(youtubeId)}&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return false;
    const payload = await response.json();
    const status = payload?.items?.[0]?.status || {};
    return String(status.privacyStatus || '').toLowerCase() === 'public';
  } catch (error) {
    return false;
  }
}

async function isPubliclyVisible(video) {
  const published = video?.published;
  if (!published) return true;

  const publishTime = getPublishTime(published);
  if (publishTime === null) return true;

  const now = Date.now();
  if (publishTime > now) return false;

  const publishUtcDate = new Date(publishTime).getUTCDate();
  const publishUtcMonth = new Date(publishTime).getUTCMonth();
  const publishUtcYear = new Date(publishTime).getUTCFullYear();
  const today = new Date(now);
  const todayUtcDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const publishUtcDateStart = Date.UTC(publishUtcYear, publishUtcMonth, publishUtcDate);

  if (publishUtcDateStart < todayUtcDate) return true;
  if (publishUtcDateStart === todayUtcDate) return isYouTubePublic(video);
  return true;
}

exports.handler = async (event, context) => {
  try {
    // Read content.json from the repository
    const contentPath = path.join(__dirname, '../../data/content.json');
    const content = fs.readFileSync(contentPath, 'utf-8');
    const items = JSON.parse(content);
    
    // Filter to only include publicly visible videos (matching server.py logic)
    const visibleItems = [];
    for (const item of items) {
      if (await isPubliclyVisible(item)) {
        visibleItems.push(item);
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(visibleItems)
    };
  } catch (error) {
    console.error('Error reading content:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to read content' })
    };
  }
};
