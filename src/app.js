const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware');

const app = express();

app.set('trust proxy', 1);

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

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
