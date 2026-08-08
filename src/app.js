const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { ensureDb } = require('./config/db');
const { notFound, errorHandler } = require('./middleware');

const app = express();

app.set('trust proxy', 1);

// On Vercel the app is served under the /api path. Normalize the URL so the
// existing root-mounted routes keep working whether the request arrives as
// /api/... or /... (local development). The original path is preserved in
// req.originalUrl for error reporting.
app.use((req, _res, next) => {
  const url = req.url || '/';
  const qIndex = url.indexOf('?');
  const pathname = qIndex === -1 ? url : url.slice(0, qIndex);
  const search = qIndex === -1 ? '' : url.slice(qIndex);

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    req.url = (pathname === '/api' ? '/' : pathname.slice(4)) + search;
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
    skip: () => env.nodeEnv === 'test',
  })
);

app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    limit: env.rateLimit.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) =>
  res.json({ name: 'Donation Management System API', version: '1.0.0', status: 'ok' })
);

app.get('/health', (_req, res) =>
  res.json({
    success: true,
    message: 'API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
);

// Connect MongoDB lazily for every API route that needs it. Public routes
// above (/ and /health) never force a database connection.
app.use('/', ensureDb, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
