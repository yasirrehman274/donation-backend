const { Schema, model } = require('mongoose');
const { LOAN_STATUS } = require('../utils/constants');
const { jsonTransform } = require('../utils/helpers');

const loanSchema = new Schema(
  {
    _id: { type: String },
    borrowerName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, default: '', maxlength: 20 },
    cnic: { type: String, trim: true, default: '', maxlength: 30 },
    amount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },
    date: { type: String, trim: true, default: '' },
    returnDate: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: Object.values(LOAN_STATUS),
      default: LOAN_STATUS.ACTIVE,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
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

loanSchema.index({ status: 1 });
loanSchema.index({ borrowerName: 1 });

module.exports = model('Loan', loanSchema);
