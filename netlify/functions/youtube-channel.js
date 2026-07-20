const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchFromYouTube(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

exports.handler = async (event, context) => {
  try {
    // Read settings to get API credentials
    const settingsPath = path.join(__dirname, '../../data/settings.json');
    let settings = {};
    
    try {
      const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(settingsContent);
    } catch (e) {
      console.warn('Could not read settings.json from filesystem:', e);
    }
    
    const youtubeApiKey = settings.youtubeApiKey;
    const youtubeChannelId = settings.youtubeChannelId;
    
    if (!youtubeApiKey || !youtubeChannelId) {
      console.error('Missing YouTube credentials:', { youtubeApiKey: !!youtubeApiKey, youtubeChannelId: !!youtubeChannelId });
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'YouTube credentials not configured' })
      };
    }
    
    // Fetch channel information from YouTube API
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${youtubeChannelId}&key=${youtubeApiKey}`;
    const response = await fetchFromYouTube(url);
    
    if (response.error) {
      console.error('YouTube API error:', response.error);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'YouTube API error: ' + (response.error.message || JSON.stringify(response.error)) })
      };
    }
    
    if (!response.items || response.items.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Channel not found' })
      };
    }
    
    const channel = response.items[0];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        profileImageUrl: channel.snippet.thumbnails.high.url,
        subscriberCount: channel.statistics.subscriberCount
      })
    };
  } catch (error) {
    console.error('Error fetching YouTube channel:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch YouTube data: ' + error.message })
    };
  }
};
