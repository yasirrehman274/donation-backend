const { test, before, after } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.AUTH_ENABLED = 'true';
process.env.JWT_SECRET = 'test-secret-1234567890';
process.env.RATE_LIMIT_LIMIT = '100000';
// Force local /uploads storage in the API tests so they stay hermetic
// (no network / Cloudinary account required). The Cloudinary code path is
// covered separately by tests/upload.test.js with a stubbed uploader.
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = require('../src/app');
const { User } = require('../src/models');

let mongo;
let adminToken;
let memberToken;

const login = async (phone, password) =>
  request(app).post('/auth/login').send({ phone, password });

const build = (token) => ({
  get: (path) => request(app).get(path).set('Authorization', `Bearer ${token}`),
  post: (path) => request(app).post(path).set('Authorization', `Bearer ${token}`),
  put: (path) => request(app).put(path).set('Authorization', `Bearer ${token}`),
  delete: (path) => request(app).delete(path).set('Authorization', `Bearer ${token}`),
});
const admin = () => build(adminToken);
const member = () => build(memberToken);

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.create({ fullName: 'Test Admin', phone: '03000000000', password: 'Admin@123', role: 'admin' });
  await User.create({ fullName: 'Test Member', phone: '03111111111', password: 'Member@123', role: 'member' });
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('login succeeds for admin and member', async () => {
  const a = await login('03000000000', 'Admin@123');
  assert.strictEqual(a.status, 200);
  assert.ok(a.body.token);
  assert.strictEqual(a.body.user.role, 'admin');
  adminToken = a.body.token;

  const m = await login('03111111111', 'Member@123');
  assert.strictEqual(m.status, 200);
  assert.ok(m.body.token);
  memberToken = m.body.token;
});

test('login fails with wrong password', async () => {
  const res = await login('03000000000', 'wrong-password');
  assert.strictEqual(res.status, 401);
});

test('login fails with missing fields', async () => {
  const res = await request(app).post('/auth/login').send({});
  assert.strictEqual(res.status, 400);
});

test('profile requires auth and returns current user', async () => {
  const noToken = await request(app).get('/auth/profile');
  assert.strictEqual(noToken.status, 401);

  const res = await admin().get('/auth/profile');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.user.role, 'admin');
  assert.strictEqual(res.body.user.password, undefined);
});

test('member can change password', async () => {
  const res = await member()
    .put('/auth/change-password')
    .send({ oldPassword: 'Member@123', newPassword: 'Member@456' });
  assert.strictEqual(res.status, 200);

  const reLogin = await login('03111111111', 'Member@456');
  assert.strictEqual(reLogin.status, 200);
  memberToken = reLogin.body.token;
});

test('member can update own profile', async () => {
  const res = await member().put('/auth/profile').send({ fullName: 'Test Member Updated' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.user.fullName, 'Test Member Updated');
  assert.strictEqual(res.body.user.password, undefined);

  const dup = await member().put('/auth/profile').send({ phone: '03000000000' });
  assert.strictEqual(dup.status, 409);

  const revert = await member().put('/auth/profile').send({ fullName: 'Test Member' });
  assert.strictEqual(revert.status, 200);
});

test('admin can create a member user', async () => {
  const res = await admin()
    .post('/users')
    .send({ fullName: 'New Member', phone: '03222222222', password: 'NewPass123', role: 'member' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.role, 'member');
});

test('member cannot access admin-only users API', async () => {
  const res = await member().get('/users');
  assert.strictEqual(res.status, 403);
});

test('unauthenticated request is rejected', async () => {
  const res = await request(app).get('/donations');
  assert.strictEqual(res.status, 401);
});

test('admin-created donation is approved by default', async () => {
  const res = await admin()
    .post('/donations')
    .send({ donorName: 'Syed Zahid Ali', phone: '', amount: 500, date: '2026-08-01', notes: '' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.status, 'approved');
  assert.ok(res.body.id);
  assert.ok(res.body.approvedAt);
});

test('member donation is pending and only visible to the member', async () => {
  const res = await member().post('/donations').send({ amount: 1000, date: '2026-08-02' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.status, 'pending');
  assert.strictEqual(res.body.donorName, 'Test Member');

  const myList = await member().get('/donations/my');
  assert.strictEqual(myList.status, 200);
  assert.ok(myList.body.length >= 1);
  assert.ok(myList.body.every((d) => d.status === 'pending'));

  const memberList = await member().get('/donations');
  assert.strictEqual(memberList.status, 200);
  assert.strictEqual(memberList.body.length, 1);
});

test('member cannot update a donation', async () => {
  const created = await member().post('/donations').send({ amount: 200, date: '2026-08-04' });
  const res = await member().put(`/donations/${created.body.id}`).send({ amount: 300 });
  assert.strictEqual(res.status, 403);
});

test('admin approves a pending donation', async () => {
  const created = await member().post('/donations').send({ amount: 700, date: '2026-08-03' });
  assert.strictEqual(created.body.status, 'pending');

  const approved = await admin().put(`/donations/${created.body.id}/approve`);
  assert.strictEqual(approved.status, 200);
  assert.strictEqual(approved.body.status, 'approved');
  assert.ok(approved.body.approvedAt);
  assert.ok(approved.body.approvedBy);
});

test('expense CRUD works', async () => {
  const created = await admin()
    .post('/expenses')
    .send({ purpose: 'Electricity bill', category: 'Utilities', amount: 2500, date: '2026-08-05' });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.body.category, 'Utilities');

  const list = await admin().get('/expenses');
  assert.strictEqual(list.status, 200);
  assert.strictEqual(list.body.length, 1);

  const missing = await admin().post('/expenses').send({ amount: 100 });
  assert.strictEqual(missing.status, 400);
});

test('surplus derives month from date', async () => {
  const res = await admin().post('/surplus').send({ amount: 498.55, date: '2026-07-03', notes: '' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.month, '2026-07');
});

test('loan + repayment flow updates remaining amount and status', async () => {
  const loanRes = await admin()
    .post('/loans')
    .send({ borrowerName: 'Syed Nasir Ali', amount: 10000, date: '2026-08-01', returnDate: '2026-12-01' });
  assert.strictEqual(loanRes.status, 201);
  const loanId = loanRes.body.id;
  assert.strictEqual(loanRes.body.remainingAmount, 10000);

  const rep1 = await admin().post('/repayments').send({ loanId, amount: 4000, date: '2026-08-10' });
  assert.strictEqual(rep1.status, 201);
  const after1 = await admin().get(`/loans/${loanId}`);
  assert.strictEqual(after1.body.remainingAmount, 6000);
  assert.strictEqual(after1.body.status, 'active');

  const rep2 = await admin().post('/repayments').send({ loanId, amount: 6000, date: '2026-09-10' });
  assert.strictEqual(rep2.status, 201);
  const after2 = await admin().get(`/loans/${loanId}`);
  assert.strictEqual(after2.body.remainingAmount, 0);
  assert.strictEqual(after2.body.status, 'paid');

  const overpay = await admin().post('/repayments').send({ loanId, amount: 100 });
  assert.strictEqual(overpay.status, 400);
});

test('repayment list supports loanId filter', async () => {
  const loans = await admin().get('/loans');
  const loanId = loans.body[0].id;
  const res = await admin().get(`/repayments?loanId=${loanId}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.every((r) => r.loanId === loanId));
});

test('dashboard returns admin totals and current balance', async () => {
  const res = await admin().get('/dashboard');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.body.totals.currentBalance, 'number');
  assert.ok(Array.isArray(res.body.recentDonations));
});

test('reports endpoints respond', async () => {
  for (const path of ['/reports/monthly', '/reports/yearly', '/reports/loan', '/reports/donation', '/reports/expense', '/reports/member-wise']) {
    const res = await admin().get(path);
    assert.strictEqual(res.status, 200);
  }
});

test('screenshot upload works', async () => {
  const res = await admin()
    .post('/donations/upload')
    .attach('screenshot', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'proof.png');
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.url.includes('/uploads/'));
});

test('upload rejects non-image files', async () => {
  const res = await admin()
    .post('/donations/upload')
    .attach('screenshot', Buffer.from('not an image'), 'notes.txt');
  assert.strictEqual(res.status, 400);
});

test('donors CRUD and duplicate detection', async () => {
  const created = await admin().post('/donors').send({ name: 'Syed Shahid Ali', phone: '' });
  assert.strictEqual(created.status, 201);

  const list = await admin().get('/donors');
  assert.strictEqual(list.body.length, 1);

  const dup = await admin().post('/donors').send({ name: 'syed shahid ali' });
  assert.strictEqual(dup.status, 409);
});

test('rejects invalid phone numbers with 400', async () => {
  const cases = [
    ['/auth/register', { fullName: 'Bad Phone', phone: '12345', password: 'Pass@123' }],
    ['/users', { fullName: 'Bad Phone', phone: '0300123456', password: 'Pass@123', role: 'member' }],
    ['/donors', { name: 'Bad Phone Donor', phone: '0311-2345678' }],
    ['/loans', { borrowerName: 'Bad Phone Borrower', phone: '0300123456789', amount: 500 }],
    ['/donations', { donorName: 'Bad Phone Donor', phone: '0300 1234567', amount: 500 }],
  ];

  for (const [path, body] of cases) {
    const method = path === '/users' ? admin().post(path) : path === '/auth/register' ? request(app).post(path) : admin().post(path);
    const res = await method.send(body);
    assert.strictEqual(res.status, 400, `${path} should reject ${JSON.stringify(body.phone)}`);
  }

  const badLogin = await login('0345-123456', 'whatever');
  assert.strictEqual(badLogin.status, 400);

  const badUpdate = await admin().put('/users/' + (await admin().get('/users')).body[0].id).send({ phone: '0300' });
  assert.strictEqual(badUpdate.status, 400);
});

test('accepts a valid 11-digit Pakistani phone', async () => {
  const res = await admin().post('/donors').send({ name: 'Valid Phone Donor', phone: '03001234567' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.phone, '03001234567');
});

test('member submission creates an admin notification', async () => {
  const created = await member().post('/donations').send({ amount: 1500, date: '2026-08-06' });
  assert.strictEqual(created.status, 201);

  const list = await admin().get('/notifications');
  assert.strictEqual(list.status, 200);
  const found = list.body.find((n) => n.relatedDonation === created.body.id);
  assert.ok(found, 'expected a notification for the member donation');
  assert.strictEqual(found.title, 'New Donation');
  assert.match(found.message, /Test Member submitted a donation of PKR 1500\./);
  assert.strictEqual(found.type, 'new-donation');
  assert.strictEqual(found.isRead, false);
  assert.ok(found.createdAt);
});

test('notifications endpoints require admin role', async () => {
  const res = await member().get('/notifications');
  assert.strictEqual(res.status, 403);
});

test('unread-count reflects pending notifications', async () => {
  const res = await admin().get('/notifications/unread-count');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.body.count, 'number');
  assert.ok(res.body.count >= 1);
});

test('admin can mark a notification as read', async () => {
  const list = await admin().get('/notifications');
  const unread = list.body.find((n) => !n.isRead);
  assert.ok(unread, 'expected at least one unread notification');

  const res = await admin().put(`/notifications/${unread.id}/read`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.isRead, true);

  const invalid = await admin().put('/notifications/not-a-valid-id/read');
  assert.strictEqual(invalid.status, 400);
});

test('approving a donation marks its notification as read', async () => {
  const created = await member().post('/donations').send({ amount: 900, date: '2026-08-06' });
  const before = (await admin().get('/notifications')).body.find((n) => n.relatedDonation === created.body.id);
  assert.ok(before);
  assert.strictEqual(before.isRead, false);

  const approved = await admin().put(`/donations/${created.body.id}/approve`);
  assert.strictEqual(approved.status, 200);

  const after = (await admin().get('/notifications')).body.find((n) => n.id === before.id);
  assert.strictEqual(after.isRead, true);
});

test('mark all read clears unread count', async () => {
  await member().post('/donations').send({ amount: 100, date: '2026-08-06' });
  const before = await admin().get('/notifications/unread-count');
  assert.ok(before.body.count >= 1);

  const res = await admin().put('/notifications/read-all');
  assert.strictEqual(res.status, 200);

  const after = await admin().get('/notifications/unread-count');
  assert.strictEqual(after.body.count, 0);
});

test('member donation exposes the member phone in every donation response', async () => {
  const created = await admin()
    .post('/users')
    .send({ fullName: 'Phone Check Member', phone: '03334445555', password: 'Pass@123', role: 'member' });
  assert.strictEqual(created.status, 201);

  const mLogin = await login('03334445555', 'Pass@123');
  assert.strictEqual(mLogin.status, 200);
  const memberToken2 = mLogin.body.token;
  const m2 = () => build(memberToken2);

  const submitted = await m2().post('/donations').send({ amount: 2500, date: '2026-08-07' });
  assert.strictEqual(submitted.status, 201);
  assert.strictEqual(submitted.body.phone, '03334445555', 'create response should include the member phone');

  const all = await admin().get('/donations');
  const found = all.body.find((d) => d.id === submitted.body.id);
  assert.ok(found);
  assert.strictEqual(found.phone, '03334445555', 'admin list should include the member phone');

  const mine = await m2().get('/donations/my');
  const mineFound = mine.body.find((d) => d.id === submitted.body.id);
  assert.ok(mineFound);
  assert.strictEqual(mineFound.phone, '03334445555', 'member list should include the member phone');

  const one = await admin().get(`/donations/${submitted.body.id}`);
  assert.strictEqual(one.status, 200);
  assert.strictEqual(one.body.phone, '03334445555', 'getById should include the member phone');

  const approved = await admin().put(`/donations/${submitted.body.id}/approve`);
  assert.strictEqual(approved.body.phone, '03334445555', 'approve response should keep the member phone');
});

test('legacy donation with null userId resolves phone from a matching member', async () => {
  const legacy = await admin().post('/donations').send({ donorName: 'Test Member', amount: 1200, date: '2026-08-08' });
  assert.strictEqual(legacy.status, 201);
  assert.strictEqual(legacy.body.userId, null);
  assert.strictEqual(legacy.body.phone, '03111111111', 'phone should be resolved from the matched member');
});

test('stored donation phone wins over the linked member phone', async () => {
  const d = await admin().post('/donations').send({ donorName: 'Test Member', phone: '03009998877', amount: 800, date: '2026-08-08' });
  assert.strictEqual(d.status, 201);
  assert.strictEqual(d.body.phone, '03009998877');
});

test('donation with no matching user keeps the phone empty', async () => {
  const d = await admin().post('/donations').send({ donorName: 'Nobody Famous', amount: 300, date: '2026-08-08' });
  assert.strictEqual(d.status, 201);
  assert.strictEqual(d.body.phone, '');
});
