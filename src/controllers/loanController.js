const loanService = require('../services/loanService');
const { asyncHandler } = require('../utils');

const actor = (req) => req.user || null;

const index = asyncHandler(async (req, res) => {
  res.json(await loanService.list());
});

const show = asyncHandler(async (req, res) => {
  res.json(await loanService.getById(req.params.id));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await loanService.create(req.body, actor(req)));
});

const update = asyncHandler(async (req, res) => {
  res.json(await loanService.update(req.params.id, req.body));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await loanService.remove(req.params.id));
});

module.exports = { index, show, store, update, destroy };
