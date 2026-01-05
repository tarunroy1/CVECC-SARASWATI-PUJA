const express = require('express');
const router = express.Router();

const Donation = require('../models/Donations'); // ✅ correct case
const Expense = require('../models/expense');
const Budget = require('../models/Budget');
const Activity = require('../models/activity');
const User = require('../models/user');

const { verifyToken } = require('../middleware/auth');

/* =========================
   DASHBOARD STATS
========================= */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // 🔹 Total Donations
    const donationAgg = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 🔹 Total Expenses (only approved if you want strict accuracy)
    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
      // if needed later:
      // { $match: { status: 'approved' } }
    ]);

    // 🔹 Total Allocated Budget
    const budgetAgg = await Budget.aggregate([
      { $group: { _id: null, total: { $sum: '$allocated' } } }
    ]);

    // 🔹 Active Admin Count
    const activeAdmins = await User.countDocuments({
      role: { $in: ['admin', 'superadmin'] },
      isActive: true
    });

    const totalDonations = donationAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const totalBudget = budgetAgg[0]?.total || 0;

    res.json({
      totalDonations,
      totalExpenses,
      remainingBudget: totalBudget - totalExpenses,
      activeAdmins
    });

  } catch (err) {
    console.error('❌ DASHBOARD STATS ERROR:', err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

/* =========================
   RECENT ACTIVITIES
   (Frontend should call:
   /api/dashboard/activities/recent)
========================= */
router.get('/activities/recent', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (err) {
    console.error('❌ ACTIVITY LOAD ERROR:', err);
    res.status(500).json({ message: 'Failed to load activities' });
  }
});

module.exports = router;
