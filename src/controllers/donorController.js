const donorService = require('../services/donorService');
const { asyncHandler } = require('../utils');

const index = asyncHandler(async (req, res) => {
  res.json(await donorService.list());
});

const show = asyncHandler(async (req, res) => {
  res.json(await donorService.getById(req.params.id));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await donorService.create(req.body));
});

const update = asyncHandler(async (req, res) => {
  res.json(await donorService.update(req.params.id, req.body));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await donorService.remove(req.params.id));
});

module.exports = { index, show, store, update, destroy };
