const path = require('path');
const os = require('os');

function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();
  for (const name of Object.keys(networkInterfaces)) {
    for (const iface of networkInterfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function getBaseUrl() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  if (host === '0.0.0.0') {
    const localIP = getLocalIP();
    return `http://${localIP}:${port}`;
  }

  return `http://${host}:${port}`;
}

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    bodyLimit: 5 * 1024 * 1024,
  },

  database: {
    path: path.join(__dirname, '../../data', 'imagehosting.db'),
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: 0,
    keyPrefix: 'img:',
  },

  storage: {
    uploadsDir: path.join(__dirname, '../../../uploads'),
    thumbnailsDir: path.join(__dirname, '../../../thumbnails'),
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    thumbnailWidth: 300,
    thumbnailHeight: 300,
  },

  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  rateLimit: {
    uploadLimit: 10,
    windowMs: 60 * 1000,
  },

  cache: {
    imageListTTL: 300,
    imageDetailTTL: 3600,
    categoriesTTL: 3600,
    popularTTL: 300,
  },

  baseUrl: getBaseUrl(),
  localIP: getLocalIP(),
};

module.exports = config;
