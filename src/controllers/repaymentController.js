const repaymentService = require('../services/repaymentService');
const { asyncHandler } = require('../utils');

const actor = (req) => req.user || null;

const index = asyncHandler(async (req, res) => {
  res.json(await repaymentService.list({ loanId: req.query.loanId }));
});

const show = asyncHandler(async (req, res) => {
  res.json(await repaymentService.getById(req.params.id));
});

const store = asyncHandler(async (req, res) => {
  res.status(201).json(await repaymentService.create(req.body, actor(req)));
});

const destroy = asyncHandler(async (req, res) => {
  res.json(await repaymentService.remove(req.params.id));
});

module.exports = { index, show, store, destroy };
