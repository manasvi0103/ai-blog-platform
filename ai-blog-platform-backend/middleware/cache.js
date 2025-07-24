// middleware/cache.js
const NodeCache = require('node-cache');

// Create cache instance with 1 hour TTL
const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false
});

const cacheMiddleware = (duration = 3600) => {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original res.json function
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function(body) {
      cache.set(key, body, duration);
      originalJson.call(this, body);
    };

    next();
  };
};

const clearCache = (pattern) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
  } else {
    cache.flushAll();
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  cache
};