const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connect to MongoDB. Accepts an optional URI so tests can inject
 * a mongodb-memory-server URI; otherwise uses env.MONGODB_URI.
 */
const connectDB = async (uri) => {
  const url = uri || env.mongodbUri;

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message);
  });

  await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 });
  console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
};

module.exports = { connectDB };
