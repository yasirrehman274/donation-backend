const env = require('../config/env');
const { connectDB } = require('../config/db');
const { User } = require('../models');
const { ROLES } = require('../utils');

/**
 * Creates the default admin from the .env file if no admin exists yet.
 * Called automatically on server boot and by `npm run seed`.
 */
const ensureDefaultAdmin = async () => {
  const existing = await User.findOne({ role: ROLES.ADMIN });
  if (existing) {
    console.log(`[seed] Admin already exists: ${existing.fullName} (${existing.phone})`);
    return existing;
  }

  const admin = await User.create({
    fullName: env.admin.name,
    phone: env.admin.phone,
    password: env.admin.password,
    role: ROLES.ADMIN,
  });
  console.log(`[seed] Default admin created: ${admin.fullName} (${admin.phone})`);
  return admin;
};

const seed = async () => {
  await connectDB();
  await ensureDefaultAdmin();
  console.log('[seed] Done.');
  process.exit(0);
};

if (require.main === module) {
  seed().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}

module.exports = { ensureDefaultAdmin };
