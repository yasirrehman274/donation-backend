const userService = require('../services/userService');
const { asyncHandler, ApiError } = require('../utils');

const login = asyncHandler(async (req, res) => {
  const result = await userService.login(req.body);
  res.json({ message: 'Login successful', user: result.user, token: result.token });
});

const register = asyncHandler(async (req, res) => {
  const result = await userService.register(req.body);
  res.status(201).json({ message: 'Registration successful', user: result.user, token: result.token });
});

const profile = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const user = await userService.getProfile(req.user._id);
  res.json({ user });
});

const updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json({ user });
});

const changePassword = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const result = await userService.changePassword(req.user._id, req.body);
  res.json(result);
});

module.exports = { login, register, profile, updateProfile, changePassword };
