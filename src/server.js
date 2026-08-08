const env = require('./config/env');
const { connectDB } = require('./config/db');
const { ensureDefaultAdmin } = require('./utils/seed');
const { initSocket, getIO } = require('./config/socket');
const app = require('./app');
const http = require('http');

const start = async () => {
  await connectDB();
  await ensureDefaultAdmin();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`[server] API running on http://localhost:${env.port}`);
    console.log(`[server] Auth enforcement: ${env.authEnabled ? 'ENABLED' : 'disabled (compat mode)'}`);
  });

  const shutdown = () => {
    console.log('\n[server] Shutting down...');
    if (getIO()) getIO().close();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
