const reportService = require('../services/reportService');
const { asyncHandler } = require('../utils');

const monthly = asyncHandler(async (req, res) => {
  res.json(await reportService.monthlyReport(req.query.year));
});

const yearly = asyncHandler(async (req, res) => {
  res.json(await reportService.yearlyReport());
});

const memberWise = asyncHandler(async (req, res) => {
  res.json(await reportService.memberWiseReport(req.query.userId, req.query.year));
});

const expense = asyncHandler(async (req, res) => {
  res.json(await reportService.expenseReport(req.query.year));
});

const loan = asyncHandler(async (req, res) => {
  res.json(await reportService.loanReport());
});

const donation = asyncHandler(async (req, res) => {
  res.json(await reportService.donationReport(req.query));
});

module.exports = { monthly, yearly, memberWise, expense, loan, donation };
