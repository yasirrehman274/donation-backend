const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const { ApiError, ROLES } = require('../utils');

const signToken = (userId) =>
  jwt.sign({ id: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const create = async ({ fullName, phone, password, role }) => {
  const existing = await User.findOne({ phone });
  if (existing) throw new ApiError(409, 'Phone number is already registered');
  return User.create({ fullName, phone, password, role: role || ROLES.MEMBER });
};

const register = async (data) => {
  const user = await create(data);
  return { user, token: signToken(user._id) };
};

const login = async ({ phone, password }) => {
  const user = await User.findOne({ phone }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid phone or password');
  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account is inactive. Contact the administrator.');
  }
  const valid = await user.comparePassword(password);
  if (!valid) throw new ApiError(401, 'Invalid phone or password');
  return { user, token: signToken(user._id) };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const updateProfile = async (userId, { fullName, phone } = {}) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (phone !== undefined && phone !== user.phone) {
    const duplicate = await User.findOne({ phone });
    if (duplicate) throw new ApiError(409, 'Phone number is already in use');
    user.phone = phone;
  }
  if (fullName !== undefined) user.fullName = String(fullName).trim();

  await user.save();
  return user;
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  const valid = await user.comparePassword(oldPassword);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');
  if (!newPassword || String(newPassword).length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }
  user.password = newPassword;
  await user.save();
  return { message: 'Password updated successfully' };
};

const list = async ({ search = '', role, status } = {}) => {
  const query = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ fullName: regex }, { phone: regex }];
  }
  if (role) query.role = role;
  if (status) query.status = status;
  return User.find(query).sort({ createdAt: -1 });
};

const getById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const update = async (id, data) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (data.phone && data.phone !== user.phone) {
    const duplicate = await User.findOne({ phone: data.phone });
    if (duplicate) throw new ApiError(409, 'Phone number is already in use');
    user.phone = data.phone;
  }
  if (data.fullName !== undefined) user.fullName = String(data.fullName).trim();
  if (data.role !== undefined) {
    if (!Object.values(ROLES).includes(data.role)) throw new ApiError(400, 'Invalid role');
    user.role = data.role;
  }
  if (data.status !== undefined) {
    if (!['active', 'inactive'].includes(data.status)) throw new ApiError(400, 'Invalid status');
    user.status = data.status;
  }
  if (data.password) {
    if (String(data.password).length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }
    user.password = data.password;
  }

  await user.save();
  return user;
};

const remove = async (id, actorId) => {
  if (String(id) === String(actorId)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) throw new ApiError(400, 'Cannot delete the only admin account');
  }
  await user.deleteOne();
  return { message: 'User deleted successfully' };
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  create,
  list,
  getById,
  update,
  remove,
  signToken,
};
