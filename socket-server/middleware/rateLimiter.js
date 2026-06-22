const logger = require('../utils/logger');

// Basic memory store for rate limiting
const rateLimits = new Map();

// Allow 20 events per 5 seconds
const LIMIT = 20;
const WINDOW_MS = 5000;

module.exports = (socket, event, next) => {
  const key = `${socket.id}:${event}`;
  const now = Date.now();
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const limitData = rateLimits.get(key);

  if (now > limitData.resetTime) {
    // Reset window
    limitData.count = 1;
    limitData.resetTime = now + WINDOW_MS;
    return next();
  }

  limitData.count += 1;

  if (limitData.count > LIMIT) {
    logger.warn(`Rate limit exceeded for event ${event} by ${socket.id}`);
    return next(new Error('Rate limit exceeded. Please slow down.'));
  }

  next();
};
