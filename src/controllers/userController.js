const userService = require('../services/userService');
const { asyncHandler } = require('../utils');

const index = asyncHandler(async (req, res) => {
  res.json(await userService.list(req.query));
});

const show = asyncHandler(async (req, res) => {
  res.json(await userService.getById(req.params.id));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await userService.create(req.body));
});

const update = asyncHandler(async (req, res) => {
  res.json(await userService.update(req.params.id, req.body));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await userService.remove(req.params.id, req.user && req.user._id));
});

module.exports = { index, show, store, update, destroy };
