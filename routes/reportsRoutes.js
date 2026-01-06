const express = require('express');
const router = express.Router();

const Donation = require('../models/donations');
const Expense = require('../models/expense');
const Budget = require('../models/Budget');
const { verifyToken } = require('../middleware/auth');

/**
 * =========================
 * REPORT SUMMARY
 * =========================
 */
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const donationAgg = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonations = donationAgg[0]?.total || 0;

    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseAgg[0]?.total || 0;

    const budgetAgg = await Budget.aggregate([
      { $group: { _id: null, total: { $sum: '$allocated' } } }
    ]);
    const totalBudget = budgetAgg[0]?.total || 0;

    const balance = totalDonations - totalExpenses;

    const budgetUtilization =
      totalBudget > 0
        ? Math.round((totalExpenses / totalBudget) * 100)
        : 0;

    res.json({
      totalDonations,
      totalExpenses,
      balance,
      budgetUtilization
    });

  } catch (err) {
    console.error('REPORT SUMMARY ERROR:', err);
    res.status(500).json({ message: 'Failed to load report summary' });
  }
});

/**
 * =========================
 * RECENT TRANSACTIONS
 * =========================
 */
router.get('/transactions/recent', verifyToken, async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ date: -1 })
      .limit(10);

    const expenses = await Expense.find()
      .sort({ date: -1 })
      .limit(10);

    let transactions = [];

    donations.forEach(d => {
      transactions.push({
        date: d.date,
        type: 'Donation',
        description: d.donorName || 'Donation',
        amount: d.amount,
        balance: null
      });
    });

    expenses.forEach(e => {
      transactions.push({
        date: e.date,
        type: 'Expense',
        description: e.name,
        amount: -e.amount,
        balance: null
      });
    });

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    let runningBalance = 0;
    transactions.forEach(t => {
      runningBalance += t.amount;
      t.balance = runningBalance;
      t.amount = Math.abs(t.amount);
    });

    res.json(transactions.slice(0, 10));

  } catch (err) {
    console.error('TRANSACTIONS ERROR:', err);
    res.status(500).json({ message: 'Failed to load transactions' });
  }
});

module.exports = router;
