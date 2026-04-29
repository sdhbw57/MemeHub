const fastifyPlugin = require('fastify-plugin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const SECRET_KEY = process.env.JWT_SECRET || 'memehub-admin-jwt-secret-2026';
const JWT_EXPIRES_IN = '24h';

const authPlugin = fastifyPlugin(async (fastify, options) => {
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.code(401).send({ success: false, message: '未登录' });
      }

      const decoded = jwt.verify(token, SECRET_KEY);
      request.user = decoded;
    } catch (err) {
      return reply.code(401).send({ success: false, message: '认证失败' });
    }
  });

  fastify.decorate('hashPassword', async (password) => {
    return bcrypt.hash(password, 10);
  });

  fastify.decorate('comparePassword', async (password, hash) => {
    return bcrypt.compare(password, hash);
  });

  fastify.decorate('generateToken', (user) => {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: JWT_EXPIRES_IN }
    );
  });
});

module.exports = authPlugin;
