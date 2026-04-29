const { query } = require('../utils/db');
const { get, set, invalidatePattern } = require('../utils/redis');
const config = require('../config');
const { encryptUrl } = require('../utils/crypto');

async function apiRoutes(fastify) {
  fastify.get('/api/tools/search', async (request, reply) => {
    const search = request.query.q || request.query.search || '';
    const category = request.query.category || '';
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 10));
    const offset = Math.max(0, parseInt(request.query.offset) || 0);

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('i.original_name LIKE ?');
      params.push(`%${search}%`);
    }

    if (category) {
      whereClauses.push('c.slug = ?');
      params.push(category);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSQL = `SELECT COUNT(*) as total FROM images i LEFT JOIN categories c ON i.category_id = c.id ${whereSQL}`;
    const [countResult] = await query(countSQL, params);
    const total = countResult.total;

    const dataSQL = `
      SELECT i.id, i.filename, i.original_name, i.category_id, c.name as category_name, c.slug as category_slug,
             i.file_size, i.width, i.height, i.mime_type, i.views, i.upload_time
      FROM images i
      LEFT JOIN categories c ON i.category_id = c.id
      ${whereSQL}
      ORDER BY i.upload_time DESC
      LIMIT ? OFFSET ?
    `;

    const images = await query(dataSQL, [...params, limit, offset]);

    const imagesWithUrls = images.map((img) => {
      const token = encryptUrl(img.id);
      const ext = getFileExtension(img.filename);
      return {
        id: img.id,
        name: img.original_name,
        category: img.category_name || '未分类',
        width: img.width,
        height: img.height,
        views: img.views,
        thumbnailUrl: `${config.baseUrl}/t/${encryptUrl(img.id + '_thumb')}`,
        directUrl: `${config.baseUrl}/i/${token}${ext}`,
        uploadTime: img.upload_time,
      };
    });

    return reply.send({
      success: true,
      total,
      count: imagesWithUrls.length,
      offset,
      images: imagesWithUrls,
      has_more: total > offset + imagesWithUrls.length,
    });
  });

  fastify.get('/api/tools/categories', async (request, reply) => {
    const cacheKey = 'cache:api:categories';
    const cached = await get(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    const categories = await query(
      'SELECT id, name, slug, description, image_count, sort_order FROM categories ORDER BY sort_order ASC'
    );

    const result = {
      success: true,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageCount: cat.image_count,
      })),
    };

    await set(cacheKey, result, 3600);

    return reply.send(result);
  });

  fastify.get('/api/tools/popular', async (request, reply) => {
    const limit = Math.min(20, Math.max(1, parseInt(request.query.limit) || 10));

    const cacheKey = `cache:api:popular:${limit}`;
    const cached = await get(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    const images = await query(
      `SELECT i.id, i.filename, i.original_name, i.category_id, c.name as category_name,
              i.file_size, i.width, i.height, i.views, i.upload_time
       FROM images i
       LEFT JOIN categories c ON i.category_id = c.id
       ORDER BY i.views DESC
       LIMIT ?`,
      [limit]
    );

    const result = {
      success: true,
      images: images.map((img) => {
        const token = encryptUrl(img.id);
        const ext = getFileExtension(img.filename);
        return {
          id: img.id,
          name: img.original_name,
          category: img.category_name || '未分类',
          width: img.width,
          height: img.height,
          views: img.views,
          thumbnailUrl: `${config.baseUrl}/t/${encryptUrl(img.id + '_thumb')}`,
          directUrl: `${config.baseUrl}/i/${token}${ext}`,
        };
      }),
    };

    await set(cacheKey, result, 300);

    return reply.send(result);
  });

  fastify.get('/api/tools/image/:id', async (request, reply) => {
    const imageId = request.params.id;

    const images = await query(
      `SELECT i.id, i.filename, i.original_name, i.category_id, c.name as category_name, c.slug as category_slug,
              i.file_size, i.width, i.height, i.mime_type, i.extension, i.views, i.upload_time
       FROM images i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ?`,
      [imageId]
    );

    if (images.length === 0) {
      return reply.code(404).send({ success: false, error: 'Image not found' });
    }

    const img = images[0];
    const token = encryptUrl(img.id);
    const ext = getFileExtension(img.filename);

    return reply.send({
      success: true,
      image: {
        id: img.id,
        name: img.original_name,
        category: img.category_name || '未分类',
        width: img.width,
        height: img.height,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        views: img.views,
        uploadTime: img.upload_time,
        thumbnailUrl: `${config.baseUrl}/t/${encryptUrl(img.id + '_thumb')}`,
        directUrl: `${config.baseUrl}/i/${token}${ext}`,
        urls: {
          direct: `${config.baseUrl}/i/${token}${ext}`,
          markdown: `![${img.original_name}](${config.baseUrl}/i/${token}${ext})`,
          html: `<img src="${config.baseUrl}/i/${token}${ext}" alt="${img.original_name}">`,
        },
      },
    });
  });
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  return '.' + parts[parts.length - 1];
}

module.exports = apiRoutes;
