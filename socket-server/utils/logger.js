const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  info: (msg, data = '') => {
    if (!isProduction) console.log(`[INFO] ${msg}`, data);
  },
  warn: (msg, data = '') => {
    console.warn(`[WARN] ${msg}`, data);
  },
  error: (msg, data = '') => {
    console.error(`[ERROR] ${msg}`, data);
  },
  dev: (msg, data = '') => {
    if (!isProduction) console.log(`[DEV] ${msg}`, data);
  }
};

module.exports = logger;
