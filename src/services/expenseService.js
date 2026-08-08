const { Expense } = require('../models');
const { ApiError, genCompatId, todayString } = require('../utils');

const create = async (data, actor) =>
  Expense.create({
    _id: data.id || genCompatId(),
    purpose: data.purpose,
    category: data.category || 'General',
    amount: Number(data.amount),
    date: data.date || todayString(),
    notes: data.notes || '',
    createdBy: actor && actor._id ? actor._id : null,
  });

const list = async (query = {}) => {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }
  return Expense.find(filter).sort({ createdAt: -1 });
};

const getById = async (id) => {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
};

const update = async (id, data) => {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');

  if (data.purpose !== undefined) expense.purpose = String(data.purpose).trim();
  if (data.category !== undefined) expense.category = data.category;
  if (data.amount !== undefined) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Amount must be a positive number');
    }
    expense.amount = amount;
  }
  if (data.date !== undefined) expense.date = data.date;
  if (data.notes !== undefined) expense.notes = data.notes;

  await expense.save();
  return expense;
};

const remove = async (id) => {
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  return { message: 'Expense deleted successfully' };
};

module.exports = { create, list, getById, update, remove };
