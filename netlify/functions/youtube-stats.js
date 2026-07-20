const fs = require('fs');
const path = require('path');

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

    // Read cached stats from repository
    const statsPath = path.join(__dirname, '../../data/youtube-stats-cache.json');
    let allStats = {};
    
    try {
      const statsContent = fs.readFileSync(statsPath, 'utf-8');
      allStats = JSON.parse(statsContent);
    } catch (e) {
      console.warn('Could not read youtube-stats-cache.json:', e);
    }

    // Extract requested stats
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
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch stats', stats: {} })
    };
  }
};
