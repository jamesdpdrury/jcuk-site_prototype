const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Read content.json from the repository
    const contentPath = path.join(__dirname, '../../data/content.json');
    const content = fs.readFileSync(contentPath, 'utf-8');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: content
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
