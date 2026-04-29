const fastify = require('fastify')({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  bodyLimit: 5 * 1024 * 1024,
});

fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true,
});

fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

fastify.register(require('@fastify/static'), {
  root: require('path').join(__dirname, '../../client'),
  prefix: '/',
  decorateReply: false,
});

fastify.register(require('@fastify/static'), {
  root: require('path').join(__dirname, '../../client/admin'),
  prefix: '/admin/',
  decorateReply: false,
  wildcard: false,
});

fastify.get('/admin/*', async (request, reply) => {
  const fs = require('fs');
  const path = require('path');
  const adminPath = path.join(__dirname, '../../client/admin');
  const indexPath = path.join(adminPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const stream = fs.createReadStream(indexPath);
    reply.header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(stream);
  }
  return reply.code(404).send('Not found');
});

fastify.register(require('./plugins/auth'));
fastify.register(require('./routes/images'));
fastify.register(require('./routes/categories'));
fastify.register(require('./routes/api'));
fastify.register(require('./routes/admin'));

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ code: 404, message: 'Not found' });
});

fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.code(statusCode).send({
    code: statusCode,
    message: error.message || 'Internal server error',
  });
});

async function start() {
  try {
    const fs = require('fs').promises;
    const path = require('path');

    const { ensureDirs } = require('./utils/upload');
    await ensureDirs();

    const dataDir = path.join(__dirname, '../../data');
    await fs.mkdir(dataDir, { recursive: true });

    const { runScript } = require('./utils/db');
    const initSql = require('fs').readFileSync(path.join(__dirname, '../../database/init.sqlite.sql'), 'utf8');
    await runScript(initSql);

    await fastify.listen({
      port: require('./config').server.port,
      host: require('./config').server.host,
    });

    console.log(`Server running at ${fastify.server.address().address}:${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

module.exports = fastify;
