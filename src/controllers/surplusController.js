const surplusService = require('../services/surplusService');
const { asyncHandler } = require('../utils');

const actor = (req) => req.user || null;

const index = asyncHandler(async (req, res) => {
  res.json(await surplusService.list());
});

const show = asyncHandler(async (req, res) => {
  res.json(await surplusService.getById(req.params.id));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await surplusService.create(req.body, actor(req)));
});

const update = asyncHandler(async (req, res) => {
  res.json(await surplusService.update(req.params.id, req.body));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await surplusService.remove(req.params.id));
});

module.exports = { index, show, store, update, destroy };
