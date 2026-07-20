const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const dataFilePath = path.join(rootDir, 'data', 'content.json');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getFilePath(requestPath) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const normalizedPath = safePath.split('?')[0];
  const relativePath = normalizedPath.replace(/^\//, '');

  if (normalizedPath === '/admin' || normalizedPath === '/admin/') {
    return path.join(rootDir, 'admin.html');
  }

  return path.join(rootDir, relativePath || 'index.html');
}

function serveStatic(res, requestPath) {
  const filePath = getFilePath(requestPath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { 'Content-Type': mimeType });
  stream.pipe(res);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname === '/api/videos') {
    if (req.method === 'GET') {
      sendJson(res, 200, readJsonFile(dataFilePath));
      return;
    }

    if (req.method === 'POST') {
      try {
        const payload = await parseBody(req);
        const items = readJsonFile(dataFilePath);
        const title = (payload.title || '').trim();
        const youtubeId = (payload.youtubeId || '').trim();

        if (!title || !youtubeId) {
          sendJson(res, 400, { error: 'Title and YouTube ID are required.' });
          return;
        }

        const newVideo = {
          id: Date.now(),
          contentType: 'video',
          title,
          slug: (payload.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim(),
          youtubeId,
          published: payload.published || new Date().toISOString().slice(0, 10),
          featured: Boolean(payload.featured),
          summary: payload.summary || '',
          thumbnail: payload.thumbnail || '',
          type: payload.type || 'Cruise',
          category: payload.category || 'Video',
          brand: payload.brand || '',
          series: payload.series || '',
          location: payload.location ? payload.location.split(',').map(item => item.trim()).filter(Boolean) : [],
          tags: payload.tags ? payload.tags.split(',').map(item => item.trim()).filter(Boolean) : []
        };

        items.unshift(newVideo);
        writeJsonFile(dataFilePath, items);
        sendJson(res, 201, { ok: true, video: newVideo });
      } catch (error) {
        sendJson(res, 400, { error: error.message });
      }
      return;
    }
  }

  if (pathname === '/data/content.json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(fs.readFileSync(dataFilePath, 'utf8'));
    return;
  }

  serveStatic(res, pathname);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Admin server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/admin to add videos`);
});
