const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || "collegePredictor2026";

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (reqUrl.pathname === '/api/predict') {
    const token = reqUrl.searchParams.get('token');
    if (token !== API_TOKEN) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Forbidden' }));
    }

    const home_state = reqUrl.searchParams.get('home_state');
    const gender = reqUrl.searchParams.get('gender');
    const category = reqUrl.searchParams.get('category');
    const is_pwd = reqUrl.searchParams.get('is_pwd');
    const crl_rank = reqUrl.searchParams.get('crl_rank');

    if (!home_state || !gender || !category || !is_pwd || !crl_rank) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing required query params' }));
    }

    const targetUrl = new URL('https://api.ogcollege.io/api/v1/cutoffs/predict-college/6298363b-49bd-45f0-af9b-971545c00997');
    targetUrl.searchParams.set('home_state', home_state);
    targetUrl.searchParams.set('gender', gender);
    targetUrl.searchParams.set('category', category);
    targetUrl.searchParams.set('is_pwd', is_pwd);
    targetUrl.searchParams.set('crl_rank', crl_rank);
    targetUrl.searchParams.set('page_no', '0');
    targetUrl.searchParams.set('page_size', '10000');
    targetUrl.searchParams.set('search', '');
    targetUrl.searchParams.set('program_ids', '[]');
    targetUrl.searchParams.set('institute_types', '[]');

    https.get(targetUrl.toString(), { headers: { accept: 'application/json' } }, (apiRes) => {
      res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
      apiRes.pipe(res);
    }).on('error', (err) => {
      console.error('API proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  let cleanPath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  let filePath = path.join(__dirname, cleanPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`File read error (${reqUrl.pathname} -> ${filePath}):`, err);
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Internal Server Error: ${err.message}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`AKTU College Predictor running at http://localhost:${PORT}`);
});
