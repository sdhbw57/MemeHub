const { query, execute } = require('../utils/db');
const { get, set, invalidatePattern } = require('../utils/redis');
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

  fastify.get('/api/categories/:id', async (request, reply) => {
    const { id } = request.params;
    const categories = await query(
      'SELECT id, name, slug, description, image_count, sort_order FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return reply.code(404).send({
        code: 404,
        message: 'Category not found',
        data: null,
      });
    }

    const cat = categories[0];
    return reply.send({
      code: 200,
      data: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageCount: cat.image_count,
        sortOrder: cat.sort_order,
      },
    });
  });

  fastify.post('/api/categories', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, slug, description = '', sortOrder = 0 } = request.body;

    if (!name || !slug) {
      return reply.code(400).send({
        code: 400001,
        message: 'Bad Request: name and slug are required',
        data: null,
      });
    }

    if (typeof name !== 'string' || name.length < 1 || name.length > 50) {
      return reply.code(400).send({
        code: 400002,
        message: 'Bad Request: name must be 1-50 characters',
        data: null,
      });
    }

    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug) || slug.length > 50) {
      return reply.code(400).send({
        code: 400003,
        message: 'Bad Request: slug must be lowercase alphanumeric with hyphens, max 50 chars',
        data: null,
      });
    }

    const existing = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return reply.code(409).send({
        code: 409001,
        message: 'Conflict: category slug already exists',
        data: null,
      });
    }

    const result = await execute(
      'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
      [name.trim(), slug.trim(), description.trim(), parseInt(sortOrder) || 0]
    );

    await invalidatePattern('cache:categories*');

    return reply.code(201).send({
      code: 201,
      message: 'Category created successfully',
      data: {
        id: result.lastID,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        sortOrder: parseInt(sortOrder) || 0,
      },
    });
  });

  fastify.put('/api/categories/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const { name, slug, description, sortOrder } = request.body;

    const category = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (category.length === 0) {
      return reply.code(404).send({
        code: 404,
        message: 'Category not found',
        data: null,
      });
    }

    if (slug) {
      const existing = await query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
      if (existing.length > 0) {
        return reply.code(409).send({
          code: 409001,
          message: 'Conflict: category slug already exists',
          data: null,
        });
      }
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      values.push(slug.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description.trim());
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(parseInt(sortOrder) || 0);
    }

    if (updates.length === 0) {
      return reply.code(400).send({
        code: 400004,
        message: 'Bad Request: no fields to update',
        data: null,
      });
    }

    values.push(id);
    await execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
    await invalidatePattern('cache:categories*');

    return reply.send({
      code: 200,
      message: 'Category updated successfully',
      data: { id },
    });
  });

  fastify.delete('/api/categories/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;

    const category = await query('SELECT id, name, image_count FROM categories WHERE id = ?', [id]);
    if (category.length === 0) {
      return reply.code(404).send({
        code: 404,
        message: 'Category not found',
        data: null,
      });
    }

    if (category[0].image_count > 0) {
      return reply.code(409).send({
        code: 409002,
        message: `Conflict: category contains ${category[0].image_count} images, cannot delete`,
        data: { imageCount: category[0].image_count },
      });
    }

    await execute('DELETE FROM categories WHERE id = ?', [id]);
    await invalidatePattern('cache:categories*');

    return reply.send({
      code: 200,
      message: 'Category deleted successfully',
      data: { id, name: category[0].name },
    });
  });

  fastify.post('/api/categories/batch-delete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { ids } = request.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({
        code: 400005,
        message: 'Bad Request: ids must be a non-empty array',
        data: null,
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    const categories = await query(
      `SELECT id, name, image_count FROM categories WHERE id IN (${placeholders})`,
      ids
    );

    if (categories.length === 0) {
      return reply.code(404).send({
        code: 404,
        message: 'No categories found',
        data: null,
      });
    }

    const withImages = categories.filter(c => c.image_count > 0);
    if (withImages.length > 0) {
      return reply.code(409).send({
        code: 409003,
        message: `Conflict: ${withImages.length} categories contain images and cannot be deleted`,
        data: {
          blockedCategories: withImages.map(c => ({ id: c.id, name: c.name, imageCount: c.image_count })),
        },
      });
    }

    const deletedIds = categories.map(c => c.id);
    const deletePlaceholders = deletedIds.map(() => '?').join(',');
    await execute(`DELETE FROM categories WHERE id IN (${deletePlaceholders})`, deletedIds);
    await invalidatePattern('cache:categories*');

    return reply.send({
      code: 200,
      message: `Deleted ${deletedIds.length} categories successfully`,
      data: {
        deletedIds,
        deletedNames: categories.map(c => c.name),
      },
    });
  });
}

module.exports = categoriesRoutes;
