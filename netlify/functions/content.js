const fs = require('fs');
const path = require('path');

function getPublishTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.getTime();
  } catch {
    return null;
  }
}

function isPubliclyVisible(video) {
  const published = video.published;
  if (!published) return true;
  
  const publishTime = getPublishTime(published);
  if (publishTime === null) return true;
  
  const now = Date.now();
  const elevenHoursInMs = 11 * 60 * 60 * 1000;
  
  return now >= publishTime + elevenHoursInMs;
}

exports.handler = async (event, context) => {
  try {
    // Read content.json from the repository
    const contentPath = path.join(__dirname, '../../data/content.json');
    const content = fs.readFileSync(contentPath, 'utf-8');
    const items = JSON.parse(content);
    
    // Filter to only include publicly visible videos (matching server.py logic)
    const visibleItems = items.filter(item => isPubliclyVisible(item));
    
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
