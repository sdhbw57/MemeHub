const { query } = require('../utils/db');
const { get, set } = require('../utils/redis');
const config = require('../config');

async function categoriesRoutes(fastify) {
  fastify.get('/api/categories', async (request, reply) => {
    const cacheKey = 'cache:categories';
    const cached = await get(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    const categories = await query(
      'SELECT id, name, slug, description, image_count, sort_order FROM categories ORDER BY sort_order ASC'
    );

    const result = {
      code: 200,
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageCount: cat.image_count,
        sortOrder: cat.sort_order,
      })),
    };

    await set(cacheKey, result, config.cache.categoriesTTL);

    return reply.send(result);
  });
}

module.exports = categoriesRoutes;
