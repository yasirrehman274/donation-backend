const { DATE_STRING_REGEX, MONTH_STRING_REGEX } = require('./constants');

/**
 * Generate an id in the same format the React frontend uses
 * (e.g. "id_1785697455968_61jr799x4") so the client keeps working.
 */
const genCompatId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const todayString = () => new Date().toISOString().slice(0, 10);

const monthFromDate = (value) => (typeof value === 'string' ? value.slice(0, 7) : '');

const yearFromDate = (value) => (typeof value === 'string' ? value.slice(0, 4) : '');

const isValidDateString = (value) => DATE_STRING_REGEX.test(value || '');

const isValidMonthString = (value) => MONTH_STRING_REGEX.test(value || '');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Shared toJSON transform: expose the Mongo id under `id` (like json-server did)
 * and drop the internal `_id` field.
 */
const jsonTransform = (ret) => {
  ret.id = ret._id != null ? String(ret._id) : ret.id;
  delete ret._id;
  return ret;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

module.exports = {
  genCompatId,
  todayString,
  monthFromDate,
  yearFromDate,
  isValidDateString,
  isValidMonthString,
  escapeRegex,
  jsonTransform,
  MONTH_NAMES,
};
