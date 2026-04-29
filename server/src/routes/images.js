const { query } = require('../utils/db');
const { get, set, invalidatePattern } = require('../utils/redis');
const config = require('../config');
const { encryptUrl, decryptUrl, hashImageId } = require('../utils/crypto');
const fs = require('fs');
const path = require('path');

async function imagesRoutes(fastify) {
  fastify.get('/api/images', async (request, reply) => {
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const pageSize = Math.min(
      config.pagination.maxPageSize,
      Math.max(1, parseInt(request.query.pageSize) || config.pagination.defaultPageSize)
    );
    const offset = (page - 1) * pageSize;
    const categoryId = request.query.categoryId ? parseInt(request.query.categoryId) : null;
    const search = request.query.search ? request.query.search.trim() : null;
    const sortBy = request.query.sortBy || 'upload_time';
    const sortOrder = request.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const allowedSortFields = ['upload_time', 'views', 'file_size'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'upload_time';

    const cacheKey = `cache:images:${page}:${pageSize}:${categoryId || 'all'}:${search || 'none'}:${sortField}:${sortOrder}`;

    const cached = await get(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    let whereClauses = [];
    let params = [];

    if (categoryId) {
      whereClauses.push('i.category_id = ?');
      params.push(categoryId);
    }

    if (search) {
      whereClauses.push('i.original_name LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSQL = `SELECT COUNT(*) as total FROM images i ${whereSQL}`;
    const [countResult] = await query(countSQL, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / pageSize);

    const dataSQL = `
      SELECT i.id, i.filename, i.original_name, i.category_id, c.name as category_name, c.slug as category_slug,
             i.file_size, i.width, i.height, i.mime_type, i.views, i.upload_time
      FROM images i
      LEFT JOIN categories c ON i.category_id = c.id
      ${whereSQL}
      ORDER BY i.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const images = await query(dataSQL, [...params, pageSize, offset]);

    const imagesWithUrls = images.map((img) => {
      const token = encryptUrl(img.id);
      const ext = getFileExtension(img.filename);
      const thumbId = encryptUrl(img.id + '_thumb');
      return {
        id: token,
        filename: img.filename,
        originalName: img.original_name,
        categoryId: img.category_id,
        categoryName: img.category_name,
        categorySlug: img.category_slug,
        fileSize: img.file_size,
        width: img.width,
        height: img.height,
        mimeType: img.mime_type,
        views: img.views,
        uploadTime: img.upload_time,
        thumbnailUrl: `${config.baseUrl}/t/${thumbId}`,
        directUrl: `${config.baseUrl}/i/${token}${ext}`,
      };
    });

    const result = {
      code: 200,
      data: {
        images: imagesWithUrls,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
    };

    await set(cacheKey, result, config.cache.imageListTTL);

    return reply.send(result);
  });

  fastify.get('/api/images/popular', async (request, reply) => {
    const limit = Math.min(20, Math.max(1, parseInt(request.query.limit) || 10));

    const cacheKey = `cache:popular:${limit}`;
    const cached = await get(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    const images = await query(
      `SELECT i.id, i.filename, i.original_name, i.file_size, i.width, i.height, i.views, i.upload_time
       FROM images i
       ORDER BY i.views DESC
       LIMIT ?`,
      [limit]
    );

    const result = {
      code: 200,
      data: images.map((img) => {
        const token = encryptUrl(img.id);
        const ext = getFileExtension(img.filename);
        const thumbToken = encryptUrl(img.id + '_thumb');
        return {
          id: token,
          filename: img.filename,
          originalName: img.original_name,
          fileSize: img.file_size,
          width: img.width,
          height: img.height,
          views: img.views,
          uploadTime: img.upload_time,
          thumbnailUrl: `${config.baseUrl}/t/${thumbToken}`,
          directUrl: `${config.baseUrl}/i/${token}${ext}`,
        };
      }),
    };

    await set(cacheKey, result, config.cache.popularTTL);

    return reply.send(result);
  });

  fastify.get('/api/image/:id', async (request, reply) => {
    const encryptedId = request.params.id;
    const id = decryptUrl(encryptedId);

    if (!id) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    const cacheKey = `cache:image:${id}`;
    const cached = await get(cacheKey);
    if (cached) {
      await query('UPDATE images SET views = views + 1 WHERE id = ?', [id]);
      return reply.send(cached);
    }

    const images = await query(
      `SELECT i.id, i.filename, i.original_name, i.category_id, c.name as category_name, c.slug as category_slug,
              i.file_size, i.width, i.height, i.mime_type, i.extension, i.views, i.upload_time
       FROM images i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ?`,
      [id]
    );

    if (images.length === 0) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    const img = images[0];
    const token = encryptUrl(img.id);
    const ext = getFileExtension(img.filename);
    const thumbToken = encryptUrl(img.id + '_thumb');

    const result = {
      code: 200,
      data: {
        id: token,
        filename: img.filename,
        originalName: img.original_name,
        categoryId: img.category_id,
        categoryName: img.category_name,
        categorySlug: img.category_slug,
        fileSize: img.file_size,
        width: img.width,
        height: img.height,
        mimeType: img.mime_type,
        extension: img.extension,
        views: img.views,
        uploadTime: img.upload_time,
        thumbnailUrl: `${config.baseUrl}/t/${thumbToken}`,
        directUrl: `${config.baseUrl}/i/${token}${ext}`,
        urls: {
          direct: `${config.baseUrl}/i/${token}${ext}`,
          markdown: `![${img.original_name}](${config.baseUrl}/i/${token}${ext})`,
          html: `<img src="${config.baseUrl}/i/${token}${ext}" alt="${img.original_name}">`,
          bbcode: `[img]${config.baseUrl}/i/${token}${ext}[/img]`,
        },
      },
    };

    await set(cacheKey, result, config.cache.imageDetailTTL);

    return reply.send(result);
  });

  fastify.delete('/api/image/:id', async (request, reply) => {
    const encryptedId = request.params.id;
    const id = decryptUrl(encryptedId);

    if (!id) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    const images = await query('SELECT filename FROM images WHERE id = ?', [id]);
    if (images.length === 0) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    await query('DELETE FROM images WHERE id = ?', [id]);
    await invalidatePattern('cache:*');

    return reply.send({ code: 200, message: 'Image deleted successfully' });
  });

  fastify.get('/i/:id', async (request, reply) => {
    const encryptedId = request.params.id;
    const id = decryptUrl(encryptedId);

    if (!id) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    const images = await query('SELECT filename, mime_type FROM images WHERE id = ?', [id]);
    if (images.length === 0) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    const filename = images[0].filename;
    const mimeType = images[0].mime_type;
    const filePath = path.join(config.storage.uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ code: 404, message: 'Image file not found' });
    }

    const fileStream = fs.createReadStream(filePath);
    reply.header('Content-Type', mimeType);
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    
    fileStream.on('error', () => {
      return reply.code(500).send({ code: 500, message: 'Failed to read file' });
    });
    
    return reply.send(fileStream);
  });

  fastify.get('/t/:id', async (request, reply) => {
    const encryptedId = request.params.id;
    const fullId = decryptUrl(encryptedId);

    if (!fullId) {
      return reply.code(404).send({ code: 404, message: 'Image not found' });
    }

    const [id, suffix] = fullId.split('_thumb');
    const ext = suffix ? '.' + suffix : '.jpg';
    const filename = `${id}_thumb${ext}`;
    const filePath = path.join(config.storage.thumbnailsDir, filename);

    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ code: 404, message: 'Thumbnail not found' });
    }

    const mimeType = filename.endsWith('.png') ? 'image/png' 
      : filename.endsWith('.gif') ? 'image/gif' 
      : filename.endsWith('.webp') ? 'image/webp' 
      : 'image/jpeg';

    const fileStream = fs.createReadStream(filePath);
    reply.header('Content-Type', mimeType);
    reply.header('Cache-Control', 'public, max-age=86400');
    
    fileStream.on('error', () => {
      return reply.code(500).send({ code: 500, message: 'Failed to read file' });
    });
    
    return reply.send(fileStream);
  });
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  return '.' + parts[parts.length - 1];
}

module.exports = imagesRoutes;
