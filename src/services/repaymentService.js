const { Loan, LoanRepayment } = require('../models');
const { ApiError, genCompatId, todayString, LOAN_STATUS } = require('../utils');

const repaidTotal = async (loanId) => {
  const rows = await LoanRepayment.find({ loanId }).select('amount');
  return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
};

const refreshLoan = async (loan) => {
  const repaid = await repaidTotal(loan._id);
  loan.remainingAmount = Math.max(0, Number(loan.amount) - repaid);
  loan.status = loan.remainingAmount <= 0 ? LOAN_STATUS.PAID : LOAN_STATUS.ACTIVE;
  await loan.save();
  return loan;
};

const create = async (data, actor) => {
  const loan = await Loan.findById(data.loanId);
  if (!loan) throw new ApiError(404, 'Loan not found');

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'Repayment amount must be a positive number');
  }

  const repaid = await repaidTotal(loan._id);
  const remaining = Math.max(0, Number(loan.amount) - repaid);
  if (amount > remaining) {
    throw new ApiError(
      400,
      `Repayment amount (${amount}) exceeds the remaining loan amount (${remaining})`
    );
  }

  const repayment = await LoanRepayment.create({
    _id: data.id || genCompatId(),
    loanId: String(data.loanId),
    borrowerName: data.borrowerName || loan.borrowerName || '',
    amount,
    date: data.date || todayString(),
    notes: data.notes || '',
    createdBy: actor && actor._id ? actor._id : null,
  });

  await refreshLoan(loan);
  return repayment;
};

const list = async ({ loanId } = {}) => {
  const filter = {};
  if (loanId) filter.loanId = loanId;
  return LoanRepayment.find(filter).sort({ createdAt: -1 });
};

const getById = async (id) => {
  const repayment = await LoanRepayment.findById(id);
  if (!repayment) throw new ApiError(404, 'Repayment not found');
  return repayment;
};

const remove = async (id) => {
  const repayment = await LoanRepayment.findByIdAndDelete(id);
  if (!repayment) throw new ApiError(404, 'Repayment not found');

  const loan = await Loan.findById(repayment.loanId);
  if (loan) await refreshLoan(loan);

  return { message: 'Repayment deleted successfully' };
};

module.exports = { create, list, getById, remove, repaidTotal, refreshLoan };
