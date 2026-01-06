const express = require('express');
const router = express.Router();

const Donation = require('../models/Donations');
const Expense = require('../models/expense');
const Budget = require('../models/budget');

/**
 * GET dashboard stats
 */
router.get('/', async (req, res) => {
    try {
        // 🔹 Total Donations
        const totalDonationsAgg = await Donation.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // 🔹 Total Expenses
        const totalExpensesAgg = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // 🔹 Total Allocated Budget
        const totalAllocatedAgg = await Budget.aggregate([
            { $group: { _id: null, total: { $sum: "$allocatedAmount" } } }
        ]);

        // 🔹 Total Spent Budget
        const totalSpentAgg = await Budget.aggregate([
            { $group: { _id: null, total: { $sum: "$spentAmount" } } }
        ]);

        const totalDonations = totalDonationsAgg[0]?.total || 0;
        const totalExpenses = totalExpensesAgg[0]?.total || 0;
        const totalAllocated = totalAllocatedAgg[0]?.total || 0;
        const totalSpent = totalSpentAgg[0]?.total || 0;

        res.json({
            totalDonations,
            totalExpenses,
            remainingBudget: totalAllocated - totalSpent, // ✅ CORRECT LOGIC
            activeAdmins: 1, // temp

            // trends (can be calculated later)
            donationTrend: 0,
            expenseTrend: 0,
            budgetTrend: 0,
            adminTrend: 0
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

