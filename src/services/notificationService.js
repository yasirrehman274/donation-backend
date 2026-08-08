const { Notification } = require('../models');
const { emitToAdmins } = require('../config/socket');
const { ApiError } = require('../utils');

const formatPKR = (num) => `PKR ${Number(num || 0)}`;

const create = async ({ title, message, type = 'info', relatedDonation = '' }) => {
  const notification = await Notification.create({ title, message, type, relatedDonation });
  return notification.toJSON();
};

/**
 * Called whenever a family member submits a donation: persists a notification
 * and broadcasts it to every connected admin in real time.
 */
const notifyNewDonation = async (donation) => {
  const notification = await create({
    title: 'New Donation',
    message: `${donation.donorName || 'A family member'} submitted a donation of ${formatPKR(donation.amount)}.`,
    type: 'new-donation',
    relatedDonation: String(donation._id),
  });
  emitToAdmins('new-donation', notification);
  return notification;
};

const list = async (limit = 50) => {
  const docs = await Notification.find().sort({ createdAt: -1 }).limit(limit);
  return docs.map((doc) => doc.toJSON());
};

const unreadCount = async () => Notification.countDocuments({ isRead: false });

const markRead = async (id) => {
  const notification = await Notification.findById(id);
  if (!notification) throw new ApiError(404, 'Notification not found');

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
    emitToAdmins('notifications-updated');
  }
  return notification.toJSON();
};

const markAllRead = async () => {
  const result = await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
  if (result.modifiedCount > 0) emitToAdmins('notifications-updated');
  return { modifiedCount: result.modifiedCount };
};

/**
 * Marks every notification for a donation as read so it leaves the admin's
 * pending list once the donation is approved.
 */
const markDonationRead = async (donationId) => {
  const result = await Notification.updateMany(
    { relatedDonation: String(donationId), isRead: false },
    { $set: { isRead: true } }
  );
  if (result.modifiedCount > 0) emitToAdmins('notifications-updated');
  return { modifiedCount: result.modifiedCount };
};

module.exports = { create, notifyNewDonation, list, unreadCount, markRead, markAllRead, markDonationRead };
