const path = require('path');

const config = {
  // Server settings
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    bodyLimit: 5 * 1024 * 1024, // 5MB
  },

  // SQLite database
  database: {
    path: path.join(__dirname, '../../data', 'imagehosting.db'),
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: 0,
    keyPrefix: 'img:',
  },

  // File storage
  storage: {
    uploadsDir: path.join(__dirname, '../../../uploads'),
    thumbnailsDir: path.join(__dirname, '../../../thumbnails'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    thumbnailWidth: 300,
    thumbnailHeight: 300,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Rate limiting (requests per minute per IP)
  rateLimit: {
    uploadLimit: 10,
    windowMs: 60 * 1000, // 1 minute
  },

  // Cache TTL (seconds)
  cache: {
    imageListTTL: 300, // 5 minutes
    imageDetailTTL: 3600, // 1 hour
    categoriesTTL: 3600, // 1 hour
    popularTTL: 300, // 5 minutes
  },

  // Base URL for direct links
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
};

module.exports = config;
