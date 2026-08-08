const { Schema, model } = require('mongoose');
const { DONATION_STATUS } = require('../utils/constants');
const { jsonTransform } = require('../utils/helpers');

const donationSchema = new Schema(
  {
    _id: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    donorName: { type: String, trim: true, default: '', maxlength: 100 },
    phone: { type: String, trim: true, default: '', maxlength: 20 },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, trim: true, default: '' },
    month: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, trim: true, default: '' },
    screenshot: { type: String, default: '' },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: Object.values(DONATION_STATUS),
      default: DONATION_STATUS.PENDING,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
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

donationSchema.index({ userId: 1 });
donationSchema.index({ date: 1 });
donationSchema.index({ month: 1 });
donationSchema.index({ status: 1 });

module.exports = model('Donation', donationSchema);
