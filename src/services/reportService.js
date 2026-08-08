const { Donation, Expense, Loan, LoanRepayment, Surplus, User } = require('../models');
const { ApiError, MONTH_NAMES, yearFromDate, monthFromDate } = require('../utils');

const sum = (rows) => rows.reduce((total, row) => total + Number(row.amount || 0), 0);

const byMonth = (rows, year, monthIndex) =>
  rows.filter(
    (row) =>
      yearFromDate(row.date) === String(year) &&
      Number(monthFromDate(row.date).slice(5)) === monthIndex
  );

const byYear = (rows, year) => rows.filter((row) => yearFromDate(row.date) === String(year));

const loadAll = async () => {
  const [donations, expenses, loans, repayments, surplus] = await Promise.all([
    Donation.find(),
    Expense.find(),
    Loan.find(),
    LoanRepayment.find(),
    Surplus.find(),
  ]);
  return { donations, expenses, loans, repayments, surplus };
};

const monthlyReport = async (year) => {
  const y = year || new Date().getFullYear();
  const { donations, expenses, loans, repayments, surplus } = await loadAll();

  const rows = MONTH_NAMES.map((name, i) => {
    const m = i + 1;
    const don = sum(byMonth(donations, y, m));
    const exp = sum(byMonth(expenses, y, m));
    const loan = sum(byMonth(loans, y, m));
    const rep = sum(byMonth(repayments, y, m));
    const sur = sum(byMonth(surplus, y, m));
    return {
      month: m,
      monthName: name,
      donations: don,
      expenses: exp,
      loansGiven: loan,
      repayments: rep,
      surplus: sur,
      net: don - exp - loan + rep + sur,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.donations += r.donations;
      acc.expenses += r.expenses;
      acc.loansGiven += r.loansGiven;
      acc.repayments += r.repayments;
      acc.surplus += r.surplus;
      acc.net += r.net;
      return acc;
    },
    { donations: 0, expenses: 0, loansGiven: 0, repayments: 0, surplus: 0, net: 0 }
  );

  return { year: Number(y), rows, totals };
};

const yearlyReport = async () => {
  const { donations, expenses, loans, repayments, surplus } = await loadAll();

  const yearsSet = new Set([
    ...[donations, expenses, loans, repayments, surplus].flatMap((rows) =>
      rows.map((row) => yearFromDate(row.date))
    ),
    String(new Date().getFullYear()),
  ]);
  const years = [...yearsSet].filter(Boolean).sort();

  const rows = years.map((y) => {
    const don = sum(byYear(donations, y));
    const exp = sum(byYear(expenses, y));
    const loan = sum(byYear(loans, y));
    const rep = sum(byYear(repayments, y));
    const sur = sum(byYear(surplus, y));
    return { year: Number(y), donations: don, expenses: exp, loansGiven: loan, repayments: rep, surplus: sur, net: don - exp - loan + rep + sur };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.donations += r.donations;
      acc.expenses += r.expenses;
      acc.loansGiven += r.loansGiven;
      acc.repayments += r.repayments;
      acc.surplus += r.surplus;
      acc.net += r.net;
      return acc;
    },
    { donations: 0, expenses: 0, loansGiven: 0, repayments: 0, surplus: 0, net: 0 }
  );

  return { rows, totals };
};

const memberWiseReport = async (userId, year) => {
  const y = year || new Date().getFullYear();

  if (userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'Member not found');
    const donations = await Donation.find({ userId }).sort({ date: -1 });

    const monthly = MONTH_NAMES.map((name, i) => {
      const m = i + 1;
      const rows = byMonth(donations, y, m);
      return { month: m, monthName: name, count: rows.length, total: sum(rows) };
    });

    return {
      member: { id: user.id, fullName: user.fullName, phone: user.phone },
      year: Number(y),
      monthly,
      total: sum(donations),
      count: donations.length,
    };
  }

  const donations = await Donation.find({ status: 'approved' });
  const userIds = [...new Set(donations.map((d) => d.userId).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const map = new Map();
  for (const d of donations) {
    const key = d.userId ? String(d.userId) : `name:${d.donorName || 'unknown'}`;
    if (!map.has(key)) {
      map.set(key, {
        memberId: d.userId || null,
        memberName: d.userId
          ? userMap.get(String(d.userId))?.fullName || 'Member'
          : d.donorName || 'Unknown',
        count: 0,
        total: 0,
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.total += Number(d.amount || 0);
  }

  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  return { rows, total: sum(donations), count: donations.length };
};

const expenseReport = async (year) => {
  const y = year ? String(year) : null;
  const expenses = await Expense.find();
  const filtered = y ? expenses.filter((e) => yearFromDate(e.date) === y) : expenses;

  const byCategory = {};
  filtered.forEach((e) => {
    const c = e.category || 'General';
    if (!byCategory[c]) byCategory[c] = { category: c, count: 0, total: 0 };
    byCategory[c].count += 1;
    byCategory[c].total += Number(e.amount || 0);
  });

  const monthly = MONTH_NAMES.map((name, i) => {
    const m = i + 1;
    const rows = byMonth(filtered, y || new Date().getFullYear(), m);
    return { month: m, monthName: name, count: rows.length, total: sum(rows) };
  });

  return {
    year: y ? Number(y) : null,
    total: sum(filtered),
    count: filtered.length,
    categories: Object.values(byCategory).sort((a, b) => b.total - a.total),
    monthly,
  };
};

const loanReport = async () => {
  const [loans, repayments] = await Promise.all([Loan.find(), LoanRepayment.find()]);

  const repaidByLoan = new Map();
  repayments.forEach((r) => {
    repaidByLoan.set(r.loanId, (repaidByLoan.get(r.loanId) || 0) + Number(r.amount || 0));
  });

  const rows = loans.map((l) => {
    const repaid = repaidByLoan.get(l.id) || 0;
    const remaining = Math.max(0, Number(l.amount) - repaid);
    return {
      id: l.id,
      borrowerName: l.borrowerName,
      phone: l.phone,
      amount: l.amount,
      repaid,
      remaining,
      status: remaining <= 0 ? 'paid' : l.status,
      date: l.date,
      returnDate: l.returnDate,
    };
  });

  const outstanding = rows.reduce((t, r) => t + r.remaining, 0);
  const active = rows.filter((r) => r.remaining > 0).length;

  return {
    totals: {
      loans: loans.length,
      given: sum(loans),
      repaid: sum(repayments),
      outstanding,
      active,
      completed: rows.length - active,
    },
    rows,
  };
};

const donationReport = async ({ year, month, donorName } = {}) => {
  let donations = await Donation.find();
  if (year) donations = donations.filter((d) => yearFromDate(d.date) === String(year));
  if (month) donations = donations.filter((d) => monthFromDate(d.date) === String(month));
  if (donorName) {
    donations = donations.filter((d) =>
      String(d.donorName || '').toLowerCase().includes(String(donorName).toLowerCase())
    );
  }

  const statusSummary = { approved: 0, pending: 0, rejected: 0 };
  donations.forEach((d) => {
    statusSummary[d.status] += Number(d.amount || 0);
  });

  const byMonth = MONTH_NAMES.map((name, i) => {
    const rows = donations.filter((d) => Number(monthFromDate(d.date).slice(5)) === i + 1);
    return { month: i + 1, monthName: name, count: rows.length, total: sum(rows) };
  });

  const byDonorMap = new Map();
  donations.forEach((d) => {
    const key = d.donorName || 'Unknown';
    if (!byDonorMap.has(key)) byDonorMap.set(key, { donorName: key, count: 0, total: 0 });
    const entry = byDonorMap.get(key);
    entry.count += 1;
    entry.total += Number(d.amount || 0);
  });

  return {
    filters: { year: year || null, month: month || null, donorName: donorName || null },
    total: sum(donations),
    count: donations.length,
    statusSummary,
    byMonth,
    byDonor: [...byDonorMap.values()].sort((a, b) => b.total - a.total),
  };
};

module.exports = {
  monthlyReport,
  yearlyReport,
  memberWiseReport,
  expenseReport,
  loanReport,
  donationReport,
};
