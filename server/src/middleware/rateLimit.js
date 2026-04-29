const rateLimitMap = new Map();

function rateLimit(options) {
  const { maxRequests, windowMs, keyGenerator } = options;

  return async (request, reply) => {
    const key = keyGenerator ? keyGenerator(request) : request.ip;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, []);
    }

    const timestamps = rateLimitMap.get(key);
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      reply.code(429).send({
        code: 429,
        message: 'Too many requests, please try again later',
      });
      return false;
    }

    validTimestamps.push(now);
    rateLimitMap.set(key, validTimestamps);

    setInterval(() => {
      const ts = rateLimitMap.get(key);
      if (ts) {
        const cleaned = ts.filter((t) => Date.now() - t < windowMs);
        if (cleaned.length === 0) {
          rateLimitMap.delete(key);
        } else {
          rateLimitMap.set(key, cleaned);
        }
      }
    }, windowMs);

    return true;
  };
}

function cleanOldEntries() {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((ts) => now - ts < 60000);
    if (valid.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, valid);
    }
  }
}

setInterval(cleanOldEntries, 60000);

module.exports = { rateLimit };
