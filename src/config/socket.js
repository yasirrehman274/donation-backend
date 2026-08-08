const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');
const { User } = require('../models');
const { ROLES } = require('../utils');

const ADMIN_ROOM = 'admin';

let io = null;

/**
 * Attaches Socket.IO to an existing HTTP server. Every authenticated admin
 * joins the "admin" room and receives admin broadcasts (e.g. new-donation).
 *
 * In compat mode (AUTH_ENABLED=false) the connection is accepted without a
 * token and treated as an admin, mirroring the REST auth middleware.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  io.use(async (socket, next) => {
    if (!env.authEnabled) return next();

    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('unauthorized'));

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      return next(new Error('unauthorized'));
    }

    try {
      const user = await User.findById(payload.id);
      if (!user) return next(new Error('unauthorized'));
      if (user.role !== ROLES.ADMIN) return next(new Error('forbidden'));
      socket.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    socket.join(ADMIN_ROOM);
  });

  return io;
};

const emitToAdmins = (event, payload) => {
  if (io) io.to(ADMIN_ROOM).emit(event, payload);
};

const getIO = () => io;

module.exports = { initSocket, emitToAdmins, getIO, ADMIN_ROOM };
