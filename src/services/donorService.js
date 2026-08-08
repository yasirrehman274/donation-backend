const { Donor } = require('../models');
const { ApiError, genCompatId, escapeRegex } = require('../utils');

const list = async () => Donor.find().sort({ name: 1 });

const getById = async (id) => {
  const donor = await Donor.findById(id);
  if (!donor) throw new ApiError(404, 'Donor not found');
  return donor;
};

const create = async (data) => {
  const name = String(data.name || '').trim();
  if (!name) throw new ApiError(400, 'Donor name is required');

  const existing = await Donor.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });
  if (existing) throw new ApiError(409, 'Donor with this name already exists');

  return Donor.create({ _id: data.id || genCompatId(), name, phone: data.phone || '' });
};

const update = async (id, data) => {
  const donor = await Donor.findById(id);
  if (!donor) throw new ApiError(404, 'Donor not found');

  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name) throw new ApiError(400, 'Donor name cannot be empty');
    donor.name = name;
  }
  if (data.phone !== undefined) donor.phone = data.phone;

  await donor.save();
  return donor;
};

const remove = async (id) => {
  const donor = await Donor.findByIdAndDelete(id);
  if (!donor) throw new ApiError(404, 'Donor not found');
  return { message: 'Donor deleted successfully' };
};

module.exports = { list, getById, create, update, remove };
