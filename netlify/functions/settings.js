const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Read settings.json from the repository
    const settingsPath = path.join(__dirname, '../../data/settings.json');
    const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);
    
    // Don't expose sensitive keys to the public
    const publicSettings = {
      youtubeChannelId: settings.youtubeChannelId || '',
      logos: settings.logos || {}
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(publicSettings)
    };
  } catch (error) {
    console.error('Error reading settings:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to read settings' })
    };
  }
};
