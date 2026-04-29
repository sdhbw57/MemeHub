const { query } = require('../utils/db');
const { encryptUrl } = require('../utils/crypto');
const config = require('../config');

function getFileExtension(filename) {
  const parts = filename.split('.');
  return '.' + parts[parts.length - 1];
}

async function adminRoutes(fastify) {
  fastify.post('/admin/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ success: false, message: '用户名和密码不能为空' });
    }

    const admins = await query('SELECT * FROM admins WHERE username = ? AND status = 1', [username]);
    if (admins.length === 0) {
      await logAction('login', null, request, '用户不存在', 0);
      return reply.code(401).send({ success: false, message: '用户名或密码错误' });
    }

    const admin = admins[0];
    const isValid = await fastify.comparePassword(password, admin.password);
    if (!isValid) {
      await logAction('login', admin.id, request, '密码错误', 0);
      return reply.code(401).send({ success: false, message: '用户名或密码错误' });
    }

    await query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);
    await logAction('login', admin.id, request, '登录成功', 1);

    const token = fastify.generateToken(admin);
    return reply.send({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: { id: admin.id, username: admin.username, email: admin.email, role: admin.role }
      }
    });
  });

  fastify.post('/admin/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await logAction('logout', request.user.id, request, '退出登录', 1);
    return reply.send({ success: true, message: '已退出登录' });
  });

  fastify.get('/admin/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const admins = await query('SELECT id, username, email, role, status, last_login, create_time FROM admins WHERE id = ?', [request.user.id]);
    if (admins.length === 0) {
      return reply.code(404).send({ success: false, message: '用户不存在' });
    }
    return reply.send({ success: true, data: admins[0] });
  });

  fastify.get('/admin/dashboard', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [imageCount, todayCount, categoryCount] = await Promise.all([
      query('SELECT COUNT(*) as total FROM images').then(r => r[0].total),
      query('SELECT COUNT(*) as total FROM images WHERE DATE(upload_time) = CURDATE()').then(r => r[0].total),
      query('SELECT COUNT(*) as total FROM categories').then(r => r[0].total),
    ]);

    const recentImages = await query(
      'SELECT i.id, i.filename, i.original_name, c.name as category_name, i.file_size, i.views, i.upload_time FROM images i LEFT JOIN categories c ON i.category_id = c.id ORDER BY i.upload_time DESC LIMIT 10'
    );

    const recentImagesWithUrls = recentImages.map(img => ({
      id: img.id,
      name: img.original_name,
      category: img.category_name || '未分类',
      fileSize: img.file_size,
      views: img.views,
      thumbnailUrl: `${config.baseUrl}/t/${encryptUrl(img.id + '_thumb')}`,
      uploadTime: img.upload_time,
    }));

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return reply.send({
      success: true,
      data: {
        stats: { imageCount, todayCount, categoryCount },
        recentImages: recentImagesWithUrls,
        systemStatus: {
          uptime: Math.floor(uptime),
          memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          },
          nodeVersion: process.version,
        }
      }
    });
  });

  fastify.get('/admin/images', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = 1, pageSize = 20, search = '', categoryId = '' } = request.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('i.original_name LIKE ?');
      params.push(`%${search}%`);
    }

    if (categoryId) {
      whereClauses.push('i.category_id = ?');
      params.push(parseInt(categoryId));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countResult, images] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM images i ${whereSQL}`, params),
      query(`
        SELECT i.id, i.filename, i.original_name, i.category_id, c.name as category_name,
               i.file_size, i.width, i.height, i.mime_type, i.views, i.upload_time
        FROM images i
        LEFT JOIN categories c ON i.category_id = c.id
        ${whereSQL}
        ORDER BY i.upload_time DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(pageSize), offset])
    ]);

    const imagesWithUrls = images.map(img => ({
      id: img.id,
      name: img.original_name,
      filename: img.filename,
      category: { id: img.category_id, name: img.category_name || '未分类' },
      width: img.width,
      height: img.height,
      fileSize: img.file_size,
      mimeType: img.mime_type,
      views: img.views,
      thumbnailUrl: `${config.baseUrl}/t/${encryptUrl(img.id + '_thumb')}`,
      directUrl: `${config.baseUrl}/i/${encryptUrl(img.id)}${getFileExtension(img.filename)}`,
      uploadTime: img.upload_time,
    }));

    return reply.send({
      success: true,
      data: {
        images: imagesWithUrls,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(countResult[0].total / parseInt(pageSize)),
        }
      }
    });
  });

  fastify.delete('/admin/image/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const images = await query('SELECT filename FROM images WHERE id = ?', [id]);
    if (images.length === 0) {
      return reply.code(404).send({ success: false, message: '图片不存在' });
    }

    await query('DELETE FROM images WHERE id = ?', [id]);
    await logAction('delete_image', request.user.id, request, `删除图片 ID: ${id}`, 1);

    return reply.send({ success: true, message: '删除成功' });
  });

  fastify.post('/admin/image/batch-delete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { ids } = request.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({ success: false, message: '请选择要删除的图片' });
    }

    await query('DELETE FROM images WHERE id IN (?)', [ids]);
    await logAction('batch_delete', request.user.id, request, `批量删除 ${ids.length} 张图片`, 1);

    return reply.send({ success: true, message: `已删除 ${ids.length} 张图片` });
  });

  fastify.put('/admin/image/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const { categoryId } = request.body;

    if (!categoryId) {
      return reply.code(400).send({ success: false, message: '请选择分类' });
    }

    const [categories] = await query('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!categories) {
      return reply.code(404).send({ success: false, message: '分类不存在' });
    }

    await query('UPDATE images SET category_id = ? WHERE id = ?', [categoryId, id]);
    await logAction('update_image', request.user.id, request, `修改图片 ID: ${id} 分类为 ${categoryId}`, 1);

    return reply.send({ success: true, message: '更新成功' });
  });

  fastify.get('/admin/categories', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const categories = await query('SELECT * FROM categories ORDER BY sort_order ASC');
    return reply.send({ success: true, data: categories });
  });

  fastify.post('/admin/category', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, slug, description, sortOrder = 0 } = request.body;

    if (!name || !slug) {
      return reply.code(400).send({ success: false, message: '名称和标识符不能为空' });
    }

    const [existing] = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing) {
      return reply.code(400).send({ success: false, message: '标识符已存在' });
    }

    const result = await query(
      'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
      [name, slug, description || '', sortOrder]
    );

    await logAction('create_category', request.user.id, request, `创建分类: ${name}`, 1);

    return reply.send({ success: true, message: '创建成功', data: { id: result.insertId, name, slug, sortOrder } });
  });

  fastify.put('/admin/category/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const { name, slug, description, sortOrder } = request.body;

    const [existing] = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return reply.code(404).send({ success: false, message: '分类不存在' });
    }

    await query('UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?',
      [name, slug, description, sortOrder, id]);

    await logAction('update_category', request.user.id, request, `修改分类 ID: ${id}`, 1);

    return reply.send({ success: true, message: '更新成功' });
  });

  fastify.delete('/admin/category/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const [category] = await query('SELECT name FROM categories WHERE id = ?', [id]);
    if (!category) {
      return reply.code(404).send({ success: false, message: '分类不存在' });
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);
    await logAction('delete_category', request.user.id, request, `删除分类: ${category.name}`, 1);

    return reply.send({ success: true, message: '删除成功' });
  });

  fastify.put('/admin/category/:id/sort', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const { sortOrder } = request.body;

    await query('UPDATE categories SET sort_order = ? WHERE id = ?', [sortOrder, id]);

    return reply.send({ success: true, message: '排序更新成功' });
  });

  fastify.get('/admin/tag-rules', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const rules = await query(`
      SELECT t.id, t.tag, t.category_id, t.priority, t.is_active, c.name as category_name
      FROM tag_rules t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.priority DESC
    `);
    return reply.send({ success: true, data: rules });
  });

  fastify.post('/admin/tag-rule', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { tag, categoryId, priority = 0 } = request.body;

    if (!tag || !categoryId) {
      return reply.code(400).send({ success: false, message: '标签和分类不能为空' });
    }

    await query('INSERT INTO tag_rules (tag, category_id, priority) VALUES (?, ?, ?)', [tag, categoryId, priority]);
    await logAction('create_tag_rule', request.user.id, request, `创建标签规则: ${tag}`, 1);

    return reply.send({ success: true, message: '创建成功' });
  });

  fastify.delete('/admin/tag-rule/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    await query('DELETE FROM tag_rules WHERE id = ?', [id]);
    await logAction('delete_tag_rule', request.user.id, request, `删除标签规则 ID: ${id}`, 1);

    return reply.send({ success: true, message: '删除成功' });
  });

  fastify.put('/admin/tag-rule/:id/toggle', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const { isActive } = request.body;
    await query('UPDATE tag_rules SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);

    return reply.send({ success: true, message: '更新成功' });
  });

  fastify.get('/admin/settings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const settings = await query('SELECT * FROM settings');
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    return reply.send({ success: true, data: settingsObj });
  });

  fastify.put('/admin/setting', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { key, value } = request.body;

    if (!key) {
      return reply.code(400).send({ success: false, message: '设置项不能为空' });
    }

    const [existing] = await query('SELECT id FROM settings WHERE key = ?', [key]);
    if (existing) {
      await query('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
    } else {
      await query('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }

    await logAction('update_setting', request.user.id, request, `修改设置: ${key}`, 1);

    return reply.send({ success: true, message: '保存成功' });
  });

  fastify.get('/admin/logs', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = 1, pageSize = 20, action = '', adminId = '' } = request.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    if (action) {
      whereClauses.push('action LIKE ?');
      params.push(`%${action}%`);
    }

    if (adminId) {
      whereClauses.push('admin_id = ?');
      params.push(parseInt(adminId));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countResult, logs] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM logs ${whereSQL}`, params),
      query(`
        SELECT l.id, l.action, l.admin_id, l.admin_name, l.ip, l.details, l.status, l.create_time
        FROM logs l
        ${whereSQL}
        ORDER BY l.create_time DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(pageSize), offset])
    ]);

    return reply.send({
      success: true,
      data: {
        logs,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(countResult[0].total / parseInt(pageSize)),
        }
      }
    });
  });

  fastify.get('/admin/admins', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'super_admin') {
      return reply.code(403).send({ success: false, message: '权限不足' });
    }

    const admins = await query('SELECT id, username, email, role, status, last_login, create_time FROM admins');
    return reply.send({ success: true, data: admins });
  });

  fastify.post('/admin/admin', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'super_admin') {
      return reply.code(403).send({ success: false, message: '权限不足' });
    }

    const { username, password, email, role = 'admin' } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ success: false, message: '用户名和密码不能为空' });
    }

    const [existing] = await query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing) {
      return reply.code(400).send({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = await fastify.hashPassword(password);
    const result = await query(
      'INSERT INTO admins (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, role]
    );

    await logAction('create_admin', request.user.id, request, `创建管理员: ${username}`, 1);

    return reply.send({ success: true, message: '创建成功', data: { id: result.insertId, username, email, role } });
  });

  fastify.put('/admin/admin/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'super_admin') {
      return reply.code(403).send({ success: false, message: '权限不足' });
    }

    const { id } = request.params;
    const { password, email, role, status } = request.body;

    let updateSQL = 'UPDATE admins SET ';
    let updateParams = [];

    if (password) {
      const hashedPassword = await fastify.hashPassword(password);
      updateSQL += 'password = ?, ';
      updateParams.push(hashedPassword);
    }

    if (email !== undefined) {
      updateSQL += 'email = ?, ';
      updateParams.push(email);
    }

    if (role) {
      updateSQL += 'role = ?, ';
      updateParams.push(role);
    }

    if (status !== undefined) {
      updateSQL += 'status = ?, ';
      updateParams.push(status);
    }

    updateSQL = updateSQL.slice(0, -2);
    updateSQL += ' WHERE id = ?';
    updateParams.push(id);

    await query(updateSQL, updateParams);
    await logAction('update_admin', request.user.id, request, `修改管理员 ID: ${id}`, 1);

    return reply.send({ success: true, message: '更新成功' });
  });

  fastify.delete('/admin/admin/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'super_admin') {
      return reply.code(403).send({ success: false, message: '权限不足' });
    }

    const { id } = request.params;
    if (parseInt(id) === request.user.id) {
      return reply.code(400).send({ success: false, message: '不能删除自己' });
    }

    await query('DELETE FROM admins WHERE id = ?', [id]);
    await logAction('delete_admin', request.user.id, request, `删除管理员 ID: ${id}`, 1);

    return reply.send({ success: true, message: '删除成功' });
  });
}

async function logAction(action, adminId, request, details = '', status = 1) {
  try {
    const adminName = adminId ? (await query('SELECT username FROM admins WHERE id = ?', [adminId]))[0]?.username : null;
    await query(
      'INSERT INTO logs (action, admin_id, admin_name, ip, details, status) VALUES (?, ?, ?, ?, ?, ?)',
      [action, adminId, adminName, request.ip || '127.0.0.1', details, status]
    );
  } catch (err) {
    console.error('Log write error:', err.message);
  }
}

module.exports = adminRoutes;
