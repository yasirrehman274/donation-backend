const { User, Donation, Expense, Loan, LoanRepayment, Surplus } = require('../models');

const sumAmount = (rows) => rows.reduce((total, row) => total + Number(row.amount || 0), 0);

const sortByDateDesc = (rows) =>
  [...rows].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

const getAdminStats = async () => {
  const [members, donations, expenses, loans, repayments, surplus] = await Promise.all([
    User.countDocuments({ role: 'member' }),
    Donation.find(),
    Expense.find(),
    Loan.find(),
    LoanRepayment.find(),
    Surplus.find(),
  ]);

  const approvedDonations = sumAmount(donations.filter((d) => d.status === 'approved'));
  const pendingAmount = sumAmount(donations.filter((d) => d.status === 'pending'));
  const totalExpenses = sumAmount(expenses);
  const totalLoans = sumAmount(loans);
  const totalSurplus = sumAmount(surplus);
  const totalRepayments = sumAmount(repayments);

  const currentBalance =
    approvedDonations + totalSurplus + totalRepayments - totalExpenses - totalLoans;

  const recentDonations = sortByDateDesc(donations).slice(0, 5).map((d) => ({
    id: d.id,
    donorName: d.donorName,
    amount: d.amount,
    date: d.date,
    status: d.status,
  }));

  const recentExpenses = sortByDateDesc(expenses).slice(0, 5).map((e) => ({
    id: e.id,
    purpose: e.purpose,
    category: e.category,
    amount: e.amount,
    date: e.date,
  }));

  return {
    totals: {
      members,
      donations: donations.length,
      pendingDonations: donations.filter((d) => d.status === 'pending').length,
      approvedDonations,
      pendingAmount,
      expenses: totalExpenses,
      loans: totalLoans,
      surplus: totalSurplus,
      repayments: totalRepayments,
      currentBalance,
    },
    recentDonations,
    recentExpenses,
  };
};

const getMemberStats = async (userId) => {
  const donations = await Donation.find({ userId }).sort({ createdAt: -1 });
  const approved = sumAmount(donations.filter((d) => d.status === 'approved'));
  const pending = sumAmount(donations.filter((d) => d.status === 'pending'));
  const rejected = sumAmount(donations.filter((d) => d.status === 'rejected'));

  return {
    totals: {
      donations: donations.length,
      approved,
      pending,
      rejected,
    },
    recentDonations: donations.slice(0, 5).map((d) => ({
      id: d.id,
      amount: d.amount,
      date: d.date,
      month: d.month,
      status: d.status,
    })),
  };
};

module.exports = { getAdminStats, getMemberStats };
