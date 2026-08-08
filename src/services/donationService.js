const mongoose = require('mongoose');
const { Donation, User } = require('../models');
const notificationService = require('./notificationService');
const {
  ApiError,
  ROLES,
  DONATION_STATUS,
  genCompatId,
  todayString,
  monthFromDate,
  escapeRegex,
} = require('../utils');

const USER_PHONE_SELECT = 'fullName phone';

/**
 * Populate the related member (User) and resolve each donation's phone number
 * from the Users collection when the donation itself has no stored phone.
 *
 * Resolution order (read-time only, nothing is written back to MongoDB):
 *   1. A phone already stored on the donation wins.
 *   2. The linked user's phone (donation.userId -> User.phone).
 *   3. Fallback for legacy records where userId is null: if donorName matches
 *      an existing member, that member's phone is used.
 *   4. Otherwise the phone stays empty and the UI renders "-".
 */
const resolvePhones = async (donations) => {
  const list = donations.filter((d) => !String(d.phone || '').trim());
  if (!list.length) return;

  const unresolvedIds = list
    .filter((d) => mongoose.isValidObjectId(d.userId))
    .map((d) => d.userId);

  const byId = new Map();
  if (unresolvedIds.length) {
    const users = await User.find({ _id: { $in: unresolvedIds } }).select(USER_PHONE_SELECT);
    users.forEach((u) => byId.set(String(u._id), u.phone));
  }

  const names = list
    .filter((d) => !(mongoose.isValidObjectId(d.userId) && byId.has(String(d.userId))))
    .filter((d) => !(d.userId && typeof d.userId === 'object'))
    .map((d) => String(d.donorName || '').trim().toLowerCase())
    .filter(Boolean);

  const byName = new Map();
  if (names.length) {
    const unique = [...new Set(names)];
    const pattern = `^(${unique.map(escapeRegex).join('|')})$`;
    const users = await User.find({ fullName: new RegExp(pattern, 'i') }).select(USER_PHONE_SELECT);
    users.forEach((u) => {
      const key = String(u.fullName || '').trim().toLowerCase();
      if (key && !byName.has(key)) byName.set(key, u.phone);
    });
  }

  donations.forEach((d) => {
    if (String(d.phone || '').trim()) return;
    if (d.userId && typeof d.userId === 'object' && d.userId.phone) {
      d.phone = d.userId.phone;
      return;
    }
    if (mongoose.isValidObjectId(d.userId) && byId.has(String(d.userId))) {
      d.phone = byId.get(String(d.userId));
      return;
    }
    const key = String(d.donorName || '').trim().toLowerCase();
    if (key && byName.has(key)) d.phone = byName.get(key);
  });
};

const withPhones = async (donations) => {
  const isArray = Array.isArray(donations);
  const list = isArray ? donations : [donations];
  if (!list.length) return donations;

  await Donation.populate(list, { path: 'userId', select: USER_PHONE_SELECT });
  await resolvePhones(list);
  return donations;
};

const create = async (data, actor) => {
  const isMember = actor && actor.role === ROLES.MEMBER;
  const date = data.date || todayString();
  const month = data.month || monthFromDate(date);

  const status = data.status || (isMember ? DONATION_STATUS.PENDING : DONATION_STATUS.APPROVED);
  if (!Object.values(DONATION_STATUS).includes(status)) {
    throw new ApiError(400, 'Invalid donation status');
  }

  const donorName = (data.donorName || (isMember ? actor.fullName : '') || '').trim();

  let userId = null;
  if (isMember) userId = actor._id;
  else if (data.userId && mongoose.isValidObjectId(data.userId)) userId = data.userId;

  const donation = await Donation.create({
    _id: data.id || genCompatId(),
    userId,
    donorName,
    phone: data.phone || '',
    amount: Number(data.amount),
    date,
    month,
    paymentMethod: data.paymentMethod || '',
    screenshot: data.screenshot || '',
    notes: data.notes || '',
    status,
    approvedBy: status === DONATION_STATUS.APPROVED && actor && actor._id ? actor._id : null,
    approvedAt: status === DONATION_STATUS.APPROVED ? new Date() : null,
  });

  if (isMember) {
    try {
      await notificationService.notifyNewDonation(donation);
    } catch (err) {
      console.error('[donationService] failed to create notification:', err.message);
    }
  }

  return withPhones(donation);
};

const list = async ({ actor, query = {} } = {}) => {
  const filter = {};

  if (actor && actor.role === ROLES.MEMBER) {
    filter.userId = actor._id;
  } else {
    if (query.status) filter.status = query.status;
    if (query.month) filter.month = query.month;
    if (query.donorName) filter.donorName = new RegExp(escapeRegex(query.donorName), 'i');
    if (query.from || query.to) {
      filter.date = {};
      if (query.from) filter.date.$gte = query.from;
      if (query.to) filter.date.$lte = query.to;
    }
  }

  const donations = await Donation.find(filter).sort({ createdAt: -1 });
  return withPhones(donations);
};

const listMy = async (userId) => withPhones(await Donation.find({ userId }).sort({ createdAt: -1 }));

const getById = async (id, actor) => {
  const donation = await Donation.findById(id);
  if (!donation) throw new ApiError(404, 'Donation not found');
  if (actor && actor.role === ROLES.MEMBER && String(donation.userId) !== String(actor._id)) {
    throw new ApiError(403, 'You can only view your own donations');
  }
  return withPhones(donation);
};

const update = async (id, data, actor) => {
  const donation = await Donation.findById(id);
  if (!donation) throw new ApiError(404, 'Donation not found');
  if (actor && actor.role === ROLES.MEMBER) {
    throw new ApiError(403, 'Members cannot update donations');
  }

  if (data.donorName !== undefined) donation.donorName = String(data.donorName).trim();
  if (data.phone !== undefined) donation.phone = data.phone;
  if (data.amount !== undefined) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Amount must be a positive number');
    }
    donation.amount = amount;
  }
  if (data.date !== undefined) {
    donation.date = data.date;
    donation.month = monthFromDate(data.date);
  }
  if (data.month !== undefined) donation.month = data.month;
  if (data.paymentMethod !== undefined) donation.paymentMethod = data.paymentMethod;
  if (data.screenshot !== undefined) donation.screenshot = data.screenshot;
  if (data.notes !== undefined) donation.notes = data.notes;

  if (data.status !== undefined) {
    if (!Object.values(DONATION_STATUS).includes(data.status)) {
      throw new ApiError(400, 'Invalid donation status');
    }
    donation.status = data.status;
    if (data.status === DONATION_STATUS.APPROVED) {
      donation.approvedBy = actor && actor._id ? actor._id : null;
      donation.approvedAt = new Date();
    }
  }

  await donation.save();

  if (donation.status === DONATION_STATUS.APPROVED) {
    try {
      await notificationService.markDonationRead(donation._id);
    } catch (err) {
      console.error('[donationService] failed to resolve notifications:', err.message);
    }
  }

  return withPhones(donation);
};

const remove = async (id) => {
  const donation = await Donation.findByIdAndDelete(id);
  if (!donation) throw new ApiError(404, 'Donation not found');
  return { message: 'Donation deleted successfully' };
};

const approve = async (id, actor) => {
  const donation = await Donation.findById(id);
  if (!donation) throw new ApiError(404, 'Donation not found');
  donation.status = DONATION_STATUS.APPROVED;
  donation.approvedBy = actor && actor._id ? actor._id : null;
  donation.approvedAt = new Date();
  await donation.save();

  try {
    await notificationService.markDonationRead(donation._id);
  } catch (err) {
    console.error('[donationService] failed to resolve notifications:', err.message);
  }

  return withPhones(donation);
};

const reject = async (id, actor) => {
  const donation = await Donation.findById(id);
  if (!donation) throw new ApiError(404, 'Donation not found');
  donation.status = DONATION_STATUS.REJECTED;
  donation.approvedBy = actor && actor._id ? actor._id : null;
  donation.approvedAt = new Date();
  await donation.save();
  return withPhones(donation);
};

module.exports = { create, list, listMy, getById, update, remove, approve, reject };
