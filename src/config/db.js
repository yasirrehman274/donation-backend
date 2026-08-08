const mongoose = require('mongoose');
const env = require('./env');

// Cache the connection (and its in-flight promise) on globalThis so it survives
// across warm serverless invocations. On cold starts the cache is empty and a
// fresh connection is created lazily by the first DB-dependent request.
const cached = global.__donationSystemMongoose || { conn: null, promise: null };
global.__donationSystemMongoose = cached;

mongoose.connection.on('error', (err) => {
  console.error('[db] MongoDB connection error:', err.message);
});

/**
 * Connect to MongoDB, reusing a single cached connection across requests and
 * concurrent first requests. Accepts an optional URI so tests can inject a
 * mongodb-memory-server URI; otherwise uses env.MONGODB_URI.
 *
 * If the connection attempt fails the cached promise is reset so a later
 * request can retry. Never calls process.exit().
 */
const connectDB = async (uri) => {
  if (cached.conn) return cached.conn;

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  if (!cached.promise) {
    const url = uri || env.mongodbUri;
    cached.promise = mongoose
      .connect(url, { serverSelectionTimeoutMS: 5000 })
      .then(() => mongoose.connection)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

/**
 * Express middleware that guarantees the database is connected before any
 * DB-dependent route executes. A failed connection is forwarded to the error
 * handler (HTTP 500) instead of crashing the process.
 */
const ensureDb = async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { connectDB, ensureDb };
