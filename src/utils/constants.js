const ROLES = Object.freeze({
  ADMIN: 'admin',
  MEMBER: 'member',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const DONATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const LOAN_STATUS = Object.freeze({
  ACTIVE: 'active',
  PAID: 'paid',
  COMPLETED: 'completed',
});

const CATEGORIES = Object.freeze([
  'General',
  'Education',
  'Medical',
  'Food',
  'Construction',
  'Charity',
  'Utilities',
  'Other',
]);

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_STRING_REGEX = /^\d{4}-\d{2}$/;

const PHONE_REGEX = /^03[0-9]{9}$/;
const PHONE_REGEX_MESSAGE = 'Phone must be a valid Pakistani mobile number (e.g. 03001234567)';

module.exports = {
  ROLES,
  USER_STATUS,
  DONATION_STATUS,
  LOAN_STATUS,
  CATEGORIES,
  DATE_STRING_REGEX,
  MONTH_STRING_REGEX,
  PHONE_REGEX,
  PHONE_REGEX_MESSAGE,
};
