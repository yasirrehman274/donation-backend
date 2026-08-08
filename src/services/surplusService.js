const { Surplus } = require('../models');
const { ApiError, genCompatId, todayString, monthFromDate } = require('../utils');

const create = async (data, actor) => {
  const date = data.date || todayString();
  return Surplus.create({
    _id: data.id || genCompatId(),
    amount: Number(data.amount),
    date,
    month: data.month || monthFromDate(date),
    notes: data.notes || '',
    createdBy: actor && actor._id ? actor._id : null,
  });
};

const list = async () => Surplus.find().sort({ createdAt: -1 });

const getById = async (id) => {
  const surplus = await Surplus.findById(id);
  if (!surplus) throw new ApiError(404, 'Surplus entry not found');
  return surplus;
};

const update = async (id, data) => {
  const surplus = await Surplus.findById(id);
  if (!surplus) throw new ApiError(404, 'Surplus entry not found');

  if (data.amount !== undefined) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Amount must be a positive number');
    }
    surplus.amount = amount;
  }
  if (data.date !== undefined) {
    surplus.date = data.date;
    surplus.month = monthFromDate(data.date);
  }
  if (data.month !== undefined) surplus.month = data.month;
  if (data.notes !== undefined) surplus.notes = data.notes;

  await surplus.save();
  return surplus;
};

const remove = async (id) => {
  const surplus = await Surplus.findByIdAndDelete(id);
  if (!surplus) throw new ApiError(404, 'Surplus entry not found');
  return { message: 'Surplus entry deleted successfully' };
};

module.exports = { create, list, getById, update, remove };
