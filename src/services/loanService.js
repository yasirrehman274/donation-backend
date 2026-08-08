const { Loan, LoanRepayment } = require('../models');
const { ApiError, genCompatId, todayString, LOAN_STATUS } = require('../utils');

const repaidTotal = async (loanId) => {
  const rows = await LoanRepayment.find({ loanId }).select('amount');
  return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
};

const create = async (data, actor) => {
  const amount = Number(data.amount);
  return Loan.create({
    _id: data.id || genCompatId(),
    borrowerName: String(data.borrowerName).trim(),
    phone: data.phone || '',
    cnic: data.cnic || '',
    amount,
    remainingAmount: amount,
    date: data.date || todayString(),
    returnDate: data.returnDate || '',
    notes: data.notes || '',
    status: LOAN_STATUS.ACTIVE,
    createdBy: actor && actor._id ? actor._id : null,
  });
};

const list = async () => Loan.find().sort({ createdAt: -1 });

const getById = async (id) => {
  const loan = await Loan.findById(id);
  if (!loan) throw new ApiError(404, 'Loan not found');
  return loan;
};

const update = async (id, data) => {
  const loan = await Loan.findById(id);
  if (!loan) throw new ApiError(404, 'Loan not found');

  if (data.borrowerName !== undefined) loan.borrowerName = String(data.borrowerName).trim();
  if (data.phone !== undefined) loan.phone = data.phone;
  if (data.cnic !== undefined) loan.cnic = data.cnic;
  if (data.amount !== undefined) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Loan amount must be a positive number');
    }
    loan.amount = amount;
  }
  if (data.date !== undefined) loan.date = data.date;
  if (data.returnDate !== undefined) loan.returnDate = data.returnDate;
  if (data.notes !== undefined) loan.notes = data.notes;

  const repaid = await repaidTotal(loan._id);
  loan.remainingAmount = Math.max(0, Number(loan.amount) - repaid);
  loan.status = loan.remainingAmount <= 0 ? LOAN_STATUS.PAID : LOAN_STATUS.ACTIVE;

  await loan.save();
  return loan;
};

const remove = async (id) => {
  const loan = await Loan.findByIdAndDelete(id);
  if (!loan) throw new ApiError(404, 'Loan not found');
  await LoanRepayment.deleteMany({ loanId: id });
  return { message: 'Loan and its repayments deleted successfully' };
};

module.exports = { create, list, getById, update, remove, repaidTotal };
