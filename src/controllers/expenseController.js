const expenseService = require('../services/expenseService');
const { asyncHandler } = require('../utils');

const actor = (req) => req.user || null;

const index = asyncHandler(async (req, res) => {
  res.json(await expenseService.list(req.query));
});

const show = asyncHandler(async (req, res) => {
  res.json(await expenseService.getById(req.params.id));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await expenseService.create(req.body, actor(req)));
});

const update = asyncHandler(async (req, res) => {
  res.json(await expenseService.update(req.params.id, req.body));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await expenseService.remove(req.params.id));
});

module.exports = { index, show, store, update, destroy };
