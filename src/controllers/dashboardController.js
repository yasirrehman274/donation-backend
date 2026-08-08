const dashboardService = require('../services/dashboardService');
const { asyncHandler, ApiError } = require('../utils');

const index = asyncHandler(async (req, res) => {
  res.json(await dashboardService.getAdminStats());
});

const mine = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  res.json(await dashboardService.getMemberStats(req.user._id));
});

module.exports = { index, mine };
