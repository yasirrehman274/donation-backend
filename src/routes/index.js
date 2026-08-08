const router = require('express').Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const donationRoutes = require('./donationRoutes');
const expenseRoutes = require('./expenseRoutes');
const surplusRoutes = require('./surplusRoutes');
const loanRoutes = require('./loanRoutes');
const repaymentRoutes = require('./repaymentRoutes');
const donorRoutes = require('./donorRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/donations', donationRoutes);
router.use('/expenses', expenseRoutes);
router.use('/surplus', surplusRoutes);
router.use('/loans', loanRoutes);
router.use('/repayments', repaymentRoutes);
router.use('/donors', donorRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
