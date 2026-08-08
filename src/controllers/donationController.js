const donationService = require('../services/donationService');
const uploadImage = require('../utils/uploadImage');
const { asyncHandler, ApiError, ROLES } = require('../utils');

/**
 * In compat mode (AUTH_ENABLED=false) there is no logged-in user, so we treat
 * the caller as an admin (the current React panel is the admin console).
 */
const actor = (req) => req.user || { _id: null, role: ROLES.ADMIN };

const index = asyncHandler(async (req, res) => {
  res.json(await donationService.list({ actor: actor(req), query: req.query }));
});

const my = asyncHandler(async (req, res) => {
  if (!req.user) return res.json([]);
  res.json(await donationService.listMy(req.user._id));
});

const show = asyncHandler(async (req, res) => {
  res.json(await donationService.getById(req.params.id, actor(req)));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await donationService.create(req.body, actor(req)));
});

const update = asyncHandler(async (req, res) => {
  res.json(await donationService.update(req.params.id, req.body, actor(req)));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await donationService.remove(req.params.id));
});

const approve = asyncHandler(async (req, res) => {
  res.json(await donationService.approve(req.params.id, actor(req)));
});

const reject = asyncHandler(async (req, res) => {
  res.json(await donationService.reject(req.params.id, actor(req)));
});

const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await uploadImage(req.file, { baseUrl });
  res.status(201).json(result);
});

module.exports = { index, my, show, store, update, destroy, approve, reject, upload };
