const { Schema, model } = require('mongoose');
const { jsonTransform } = require('../utils/helpers');

const surplusSchema = new Schema(
  {
    _id: { type: String },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, trim: true, default: '' },
    month: { type: String, trim: true, default: '' },
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

surplusSchema.index({ month: 1 });

module.exports = model('Surplus', surplusSchema);
