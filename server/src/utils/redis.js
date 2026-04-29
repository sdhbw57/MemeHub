const Redis = require('ioredis');
const config = require('../config');

let redisClient = null;

function getClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || null,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }
  return redisClient;
}

async function get(key) {
  try {
    const client = getClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis GET error:', err.message);
    return null;
  }
}

async function set(key, value, ttl) {
  try {
    const client = getClient();
    const data = JSON.stringify(value);
    if (ttl) {
      await client.setex(key, ttl, data);
    } else {
      await client.set(key, data);
    }
    return true;
  } catch (err) {
    console.error('Redis SET error:', err.message);
    return false;
  }
}

async function del(key) {
  try {
    const client = getClient();
    await client.del(key);
    return true;
  } catch (err) {
    console.error('Redis DEL error:', err.message);
    return false;
  }
}

async function invalidatePattern(pattern) {
  try {
    const client = getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.error('Redis invalidate error:', err.message);
  }
}

async function close() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  getClient,
  get,
  set,
  del,
  invalidatePattern,
  close,
};
