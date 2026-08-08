const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const { asyncHandler, ApiError } = require('../utils');

const index = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  res.json(await notificationService.list(limit));
});

const count = asyncHandler(async (req, res) => {
  res.json({ count: await notificationService.unreadCount() });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid notification id');
  res.json(await notificationService.markRead(id));
});

const markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead());
});

module.exports = { index, count, markRead, markAllRead };
