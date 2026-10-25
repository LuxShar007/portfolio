// ======================================================
// Portfolio Static Server - Ultra-Premium Streaming Server
// Supports HTTP 206 Partial Content for MP4/MP3 streaming
// ======================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const SRC_DIR = path.join(__dirname, 'src');
const ASSETS_DIR = path.join(__dirname, 'assets');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
};

const server = http.createServer((req, res) => {
  let rawUrl = req.url.split('?')[0];
  let urlPath;
  try {
    urlPath = decodeURIComponent(rawUrl);
  } catch (e) {
    urlPath = rawUrl;
  }

  // Default to index.html
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  // Resolve file candidate paths
  let filePath;
  if (urlPath.startsWith('/assets/')) {
    filePath = path.join(ROOT_DIR, urlPath);
  } else {
    let pSrc = path.join(SRC_DIR, urlPath);
    let pAssets = path.join(ASSETS_DIR, urlPath);
    let pRoot = path.join(ROOT_DIR, urlPath);

    if (fs.existsSync(pSrc) && !fs.statSync(pSrc).isDirectory()) {
      filePath = pSrc;
    } else if (fs.existsSync(pAssets) && !fs.statSync(pAssets).isDirectory()) {
      filePath = pAssets;
    } else if (fs.existsSync(pRoot) && !fs.statSync(pRoot).isDirectory()) {
      filePath = pRoot;
    } else {
      filePath = pSrc; // default for 404
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const totalSize = stats.size;

    // Generate ETag based on mtime and size
    const etag = `W/"${totalSize.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
    const isCompressible = ['.html', '.css', '.js', '.json', '.svg'].includes(ext);
    const isStaticAsset = ['.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.otf', '.ttf', '.woff', '.woff2'].includes(ext);

    // Check If-None-Match for instant 304 Not Modified
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        'ETag': etag,
        'Cache-Control': isStaticAsset ? 'public, max-age=86400, stale-while-revalidate=604800' : 'public, max-age=0, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end();
    }

    // Handle HTTP Range for Video & Audio streaming
    const range = req.headers.range;
    if (range && (mime.startsWith('video/') || mime.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`,
        });
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      });

      fileStream.pipe(res);
      return;
    }

    // Handle Gzip / Deflate compression for text/code assets
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const cacheControl = isStaticAsset
      ? 'public, max-age=86400, stale-while-revalidate=604800'
      : (ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600');

    if (isCompressible && acceptEncoding.includes('gzip')) {
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Encoding': 'gzip',
        'ETag': etag,
        'Cache-Control': cacheControl,
        'Vary': 'Accept-Encoding',
        'Access-Control-Allow-Origin': '*'
      });
      const rawStream = fs.createReadStream(filePath);
      const gzipStream = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzipStream).pipe(res);
    } else if (isCompressible && acceptEncoding.includes('deflate')) {
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Encoding': 'deflate',
        'ETag': etag,
        'Cache-Control': cacheControl,
        'Vary': 'Accept-Encoding',
        'Access-Control-Allow-Origin': '*'
      });
      const rawStream = fs.createReadStream(filePath);
      const deflateStream = zlib.createDeflate({ level: 6 });
      rawStream.pipe(deflateStream).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': mime,
        'ETag': etag,
        'Cache-Control': cacheControl,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n  ✦ Ultra-Premium Portfolio Server running at http://localhost:${port}/`);
    console.log(`  ✦ Pitch Black Dark Mode / Ice White Bright Mode`);
    console.log(`  ✦ Media stream enabled with HTTP Range support\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const currentPort = PORT;
    const nextPort = currentPort + 1;
    console.warn(`\n  ⚠ Port ${currentPort} is currently in use. Falling back to http://localhost:${nextPort}/ ...`);
    server.close();
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
