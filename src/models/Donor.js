const { Schema, model } = require('mongoose');
const { jsonTransform } = require('../utils/helpers');

const donorSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, default: '', maxlength: 20 },
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

donorSchema.index({ name: 1 });

module.exports = model('Donor', donorSchema);
