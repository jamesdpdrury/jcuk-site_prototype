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
    // Get video IDs from query parameter
    const videoIdParam = event.queryStringParameters?.videoId || '';
    if (!videoIdParam) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'videoId parameter required' })
      };
    }

    // Parse video IDs
    const videoIds = videoIdParam.split(',').map(id => id.trim()).filter(Boolean);
    if (!videoIds.length) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No valid video IDs provided' })
      };
    }

    // Get API credentials from environment variables
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeApiKey) {
      console.warn('YouTube API key not configured, falling back to cache');
      return getFallbackStats(videoIds);
    }

    // Fetch live stats from YouTube API
    const stats = {};
    
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${youtubeApiKey}`;
      const response = await fetchFromYouTube(url);
      
      if (response.items) {
        response.items.forEach(item => {
          stats[item.id] = {
            viewCount: parseInt(item.statistics.viewCount || 0),
            commentCount: parseInt(item.statistics.commentCount || 0),
            likeCount: parseInt(item.statistics.likeCount || 0)
          };
        });
      }
    } catch (error) {
      console.warn('Failed to fetch from YouTube API, falling back to cache:', error.message);
      return getFallbackStats(videoIds);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify({ stats })
    };
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch stats', stats: {} })
    };
  }
};

function getFallbackStats(videoIds) {
  try {
    const statsPath = path.join(__dirname, '../../data/youtube-stats-cache.json');
    const statsContent = fs.readFileSync(statsPath, 'utf-8');
    const allStats = JSON.parse(statsContent);
    
    const stats = {};
    videoIds.forEach(videoId => {
      if (allStats[videoId]) {
        stats[videoId] = allStats[videoId];
      }
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ stats })
    };
  } catch (e) {
    console.error('Failed to read cache file:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch stats', stats: {} })
    };
  }
}
