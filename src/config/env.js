const dotenv = require('dotenv');

dotenv.config();

const parseBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/donation_system',
  jwtSecret: process.env.JWT_SECRET || 'donation-system-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  uploadLimitMb: parseInt(process.env.UPLOAD_LIMIT_MB, 10) || 5,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  authEnabled: parseBool(process.env.AUTH_ENABLED),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 300,
  },
  admin: {
    name: process.env.ADMIN_NAME || 'System Admin',
    phone: process.env.ADMIN_PHONE || '03000000000',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  },
};

if (env.nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.warn('[env] WARNING: JWT_SECRET is missing or too short for production.');
}

module.exports = env;
