const { query } = require('../utils/db');

async function requestLogger(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - (request.startTime || Date.now());
    const method = request.method;
    const url = request.url.split('?')[0];
    const statusCode = reply.statusCode;
    const ip = request.ip || request.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = request.headers['user-agent'] || 'Unknown';

    if (!url.startsWith('/health')) {
      console.log(`[API Log] ${method} ${url} ${statusCode} ${responseTime}ms IP:${ip}`);
    }

    if (url.startsWith('/api/') && !url.startsWith('/api/admin/')) {
      try {
        await logApiAccess(method, url, statusCode, ip, userAgent, responseTime);
      } catch (err) {
        console.error('Failed to log API access:', err.message);
      }
    }
  });
}

async function logApiAccess(method, url, statusCode, ip, userAgent, responseTime) {
  try {
    await query(
      `INSERT INTO api_logs (method, url, status_code, ip, user_agent, response_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [method, url, statusCode, ip, userAgent, responseTime]
    );
  } catch (err) {
    console.error('API log insert failed:', err.message);
  }
}

module.exports = requestLogger;
