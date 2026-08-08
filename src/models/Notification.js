const { Schema, model } = require('mongoose');
const { jsonTransform } = require('../utils/helpers');

const notificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, default: 'info', trim: true },
    relatedDonation: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        jsonTransform(ret);
        return ret;
      },
    },
  }
);

notificationSchema.index({ isRead: 1 });
notificationSchema.index({ relatedDonation: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = model('Notification', notificationSchema);
