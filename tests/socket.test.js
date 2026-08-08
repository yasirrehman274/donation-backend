const { test, before, after } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.AUTH_ENABLED = 'true';
process.env.JWT_SECRET = 'test-secret-1234567890';
process.env.RATE_LIMIT_LIMIT = '100000';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';

const http = require('http');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { io: ioClient } = require('socket.io-client');

const app = require('../src/app');
const { initSocket, getIO } = require('../src/config/socket');
const { User } = require('../src/models');

let mongo;
let server;
let port;
let adminToken;
let memberToken;

const login = async (phone, password) =>
  request(app).post('/auth/login').send({ phone, password });

const connectWithTimeout = (socket, ms = 5000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('socket connect timeout')), ms);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

const waitForEvent = (socket, event, ms = 5000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), ms);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.create({ fullName: 'Test Admin', phone: '03000000000', password: 'Admin@123', role: 'admin' });
  await User.create({ fullName: 'Socket Member', phone: '03111111111', password: 'Member@123', role: 'member' });

  const a = await login('03000000000', 'Admin@123');
  adminToken = a.body.token;
  const m = await login('03111111111', 'Member@123');
  memberToken = m.body.token;

  server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
});

after(async () => {
  if (getIO()) getIO().close();
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('admin socket receives new-donation when a member submits a donation', async () => {
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token: adminToken },
    reconnection: false,
    timeout: 5000,
  });
  await connectWithTimeout(socket);

  const received = waitForEvent(socket, 'new-donation');

  const res = await request(app)
    .post('/donations')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ amount: 5000, date: '2026-08-06' });
  assert.strictEqual(res.status, 201);

  const payload = await received;
  assert.strictEqual(payload.type, 'new-donation');
  assert.strictEqual(payload.title, 'New Donation');
  assert.strictEqual(payload.relatedDonation, res.body.id);
  assert.match(payload.message, /Socket Member submitted a donation of PKR 5000\./);
  assert.strictEqual(payload.isRead, false);

  socket.close();
});

test('approving a donation emits notifications-updated', async () => {
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token: adminToken },
    reconnection: false,
    timeout: 5000,
  });
  await connectWithTimeout(socket);

  const created = await request(app)
    .post('/donations')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ amount: 3000, date: '2026-08-06' });
  assert.strictEqual(created.status, 201);

  const received = waitForEvent(socket, 'notifications-updated');
  const approved = await request(app)
    .put(`/donations/${created.body.id}/approve`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.strictEqual(approved.status, 200);

  await received;
  socket.close();
});

test('socket connection is rejected for non-admin tokens', async () => {
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token: memberToken },
    reconnection: false,
    timeout: 5000,
  });

  const outcome = await new Promise((resolve) => {
    socket.once('connect', () => resolve('connected'));
    socket.once('connect_error', (err) => resolve(err.message));
  });
  socket.close();
  assert.strictEqual(outcome, 'forbidden');
});

test('socket connection is rejected without a token', async () => {
  const socket = ioClient(`http://localhost:${port}`, {
    reconnection: false,
    timeout: 5000,
  });

  const outcome = await new Promise((resolve) => {
    socket.once('connect', () => resolve('connected'));
    socket.once('connect_error', (err) => resolve(err.message));
  });
  socket.close();
  assert.strictEqual(outcome, 'unauthorized');
});

test('admin socket auto-reconnects after a dropped connection', async () => {
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token: adminToken },
    reconnection: true,
    reconnectionDelay: 100,
    reconnectionDelayMax: 300,
    timeout: 5000,
  });
  await connectWithTimeout(socket);

  const serverSocket = getIO().sockets.sockets.get(socket.id);
  assert.ok(serverSocket, 'server should track the admin socket');
  serverSocket.conn.close();

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('reconnect timeout')), 5000);
    socket.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
  });

  const received = waitForEvent(socket, 'new-donation');
  const res = await request(app)
    .post('/donations')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ amount: 777, date: '2026-08-06' });
  assert.strictEqual(res.status, 201);

  const payload = await received;
  assert.strictEqual(payload.relatedDonation, res.body.id);
  socket.close();
});
