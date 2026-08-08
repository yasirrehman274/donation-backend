const { Schema, model } = require('mongoose');
const { CATEGORIES } = require('../utils/constants');
const { jsonTransform } = require('../utils/helpers');

const expenseSchema = new Schema(
  {
    _id: { type: String },
    purpose: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: CATEGORIES, default: 'General' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
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

expenseSchema.index({ date: 1 });

module.exports = model('Expense', expenseSchema);
