const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');
const Budget = require('../models/Budget');
const Activity = require('../models/activity');
const { verifyToken, allowRoles } = require('../middleware/auth');

/* =========================
   GET ALL EXPENSES
========================= */
router.get('/', verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error('GET EXPENSE ERROR:', err);
    res.status(500).json({ message: 'Failed to load expenses' });
  }
});

/* =========================
   ADD EXPENSE (ADMIN / SUPERADMIN)
========================= */
router.post(
  '/',
  verifyToken,
  allowRoles('admin', 'superadmin'),
  async (req, res) => {
    try {
      const { name, category, amount, date, vendor, description } = req.body;

      if (!name || !category || !amount || !date) {
        return res.status(400).json({
          message: 'Name, category, amount and date are required'
        });
      }

      // Check if category exists in budget
      const budgetCategory = await Budget.findOne({ category: category.trim() });
      if (!budgetCategory) {
        return res.status(400).json({
          message: 'Category does not exist in budget. Please add category in budget first.'
        });
      }

      // Check if budget has enough remaining (only for superadmin auto-approval)
      const userRole = req.user.role;
      if (userRole === 'superadmin') {
        const remaining = budgetCategory.remaining || budgetCategory.allocated;
        if (amount > remaining) {
          return res.status(400).json({
            message: `Insufficient budget. Remaining for ${category}: ₹${remaining}`
          });
        }
      }

      const expense = new Expense({
        name,
        category: category.trim(),
        amount,
        date,
        vendor: vendor || '',
        description: description || '',
        createdBy: req.user.userId,
        status: req.user.role === 'superadmin' ? 'approved' : 'pending'
      });

      const savedExpense = await expense.save();

      // If superadmin adds expense, auto-update budget
      if (req.user.role === 'superadmin') {
        await updateBudgetRemaining(category.trim(), amount);
      }

      await Activity.create({
        type: 'Expense Added',
        user: req.user.idCardNo,
        details: `₹${savedExpense.amount} spent on ${savedExpense.name} (${savedExpense.category}) - Status: ${savedExpense.status}`
      });

      res.status(201).json(savedExpense);

    } catch (err) {
      console.error('ADD EXPENSE ERROR:', err);
      res.status(500).json({ message: 'Failed to add expense' });
    }
  }
);

/* =========================
   APPROVE EXPENSE (SUPERADMIN ONLY)
========================= */
router.put(
  '/:id/approve',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      if (expense.status === 'approved') {
        return res.status(400).json({ message: 'Expense already approved' });
      }

      // Check budget before approving
      const budget = await Budget.findOne({ category: expense.category });
      if (!budget) {
        return res.status(400).json({
          message: `Budget category "${expense.category}" not found`
        });
      }

      const remaining = budget.remaining || budget.allocated;
      if (expense.amount > remaining) {
        return res.status(400).json({
          message: `Cannot approve. Insufficient budget. Remaining: ₹${remaining}`
        });
      }

      // Update expense status
      expense.status = 'approved';
      expense.approvedBy = req.user.userId;
      expense.approvedAt = new Date();
      
      const updatedExpense = await expense.save();

      // ✅ CRITICAL: Update budget remaining amount
      await updateBudgetRemaining(expense.category, expense.amount);

      await Activity.create({
        type: 'Expense Approved',
        user: req.user.idCardNo,
        details: `Approved expense ₹${expense.amount} for ${expense.category} - ${expense.name}`
      });

      res.json({
        message: 'Expense approved successfully',
        expense: updatedExpense
      });

    } catch (err) {
      console.error('APPROVE EXPENSE ERROR:', err);
      res.status(500).json({ message: 'Failed to approve expense' });
    }
  }
);

/* =========================
   REJECT EXPENSE (SUPERADMIN ONLY)
========================= */
router.put(
  '/:id/reject',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      expense.status = 'rejected';
      const updatedExpense = await expense.save();

      await Activity.create({
        type: 'Expense Rejected',
        user: req.user.idCardNo,
        details: `Rejected expense: ${expense.name} (₹${expense.amount})`
      });

      res.json({
        message: 'Expense rejected',
        expense: updatedExpense
      });

    } catch (err) {
      console.error('REJECT EXPENSE ERROR:', err);
      res.status(500).json({ message: 'Failed to reject expense' });
    }
  }
);

/* =========================
   UPDATE EXPENSE (ADMIN + SUPERADMIN)
========================= */
router.put(
  '/:id',
  verifyToken,
  allowRoles('admin', 'superadmin'),
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      // Store old values for budget adjustment
      const oldAmount = expense.amount;
      const oldCategory = expense.category;
      const oldStatus = expense.status;

      // Update expense
      const updatedExpense = await Expense.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      // If expense was approved and amount/category changed, adjust budget
      if (oldStatus === 'approved') {
        // Reverse old amount from old category (add back to budget)
        await updateBudgetRemaining(oldCategory, -oldAmount);
        
        // Add new amount to new category if approved
        if (updatedExpense.status === 'approved') {
          await updateBudgetRemaining(updatedExpense.category, updatedExpense.amount);
        }
      }

      await Activity.create({
        type: 'Expense Updated',
        user: req.user.idCardNo,
        details: `Updated expense: ${updatedExpense.name}`
      });

      res.json(updatedExpense);

    } catch (err) {
      console.error('UPDATE EXPENSE ERROR:', err);
      res.status(500).json({ message: 'Failed to update expense' });
    }
  }
);

/* =========================
   DELETE EXPENSE (SUPERADMIN)
========================= */
router.delete(
  '/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      // If expense was approved, add back to budget
      if (expense.status === 'approved') {
        await updateBudgetRemaining(expense.category, -expense.amount);
      }

      await Expense.findByIdAndDelete(req.params.id);

      await Activity.create({
        type: 'Expense Deleted',
        user: req.user.idCardNo,
        details: `Expense deleted: ${expense.name} (₹${expense.amount})`
      });

      res.json({ message: 'Expense deleted successfully' });

    } catch (err) {
      console.error('DELETE EXPENSE ERROR:', err);
      res.status(500).json({ message: 'Failed to delete expense' });
    }
  }
);

/* =========================
   GET BUDGET CATEGORIES FOR EXPENSE FORM
========================= */
router.get('/budget-categories', verifyToken, async (req, res) => {
  try {
    const categories = await Budget.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('GET CATEGORIES ERROR:', err);
    res.status(500).json({ message: 'Failed to load categories' });
  }
});

/* =========================
   HELPER FUNCTION: Update Budget Remaining
========================= */
async function updateBudgetRemaining(category, amount) {
  try {
    // Find budget for this category
    const budget = await Budget.findOne({ category });
    
    if (!budget) {
      console.warn(`No budget found for category: ${category}`);
      return;
    }

    // Update spent amount (add expense amount)
    budget.spent = (budget.spent || 0) + amount;
    
    // Ensure spent doesn't go negative or exceed allocated
    if (budget.spent < 0) budget.spent = 0;
    if (budget.spent > budget.allocated) budget.spent = budget.allocated;
    
    // Recalculate remaining
    budget.remaining = budget.allocated - budget.spent;
    
    await budget.save();
    
    console.log(`✅ Budget updated: ${category} - Spent: ${budget.spent}, Remaining: ${budget.remaining}`);
  } catch (error) {
    console.error('UPDATE BUDGET ERROR:', error);
    throw error;
  }
}

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const Expense = require('../models/expense');
// const Budget = require('../models/Budget');
// const Activity = require('../models/activity');
// const { verifyToken, allowRoles } = require('../middleware/auth');

// /* =========================
//    GET ALL EXPENSES
// ========================= */
// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const expenses = await Expense.find().sort({ date: -1 });
//     res.json(expenses);
//   } catch (err) {
//     console.error('GET EXPENSE ERROR:', err);
//     res.status(500).json({ message: 'Failed to load expenses' });
//   }
// });

// /* =========================
//    ADD EXPENSE (ADMIN / SUPERADMIN)
// ========================= */
// router.post(
//   '/',
//   verifyToken,
//   allowRoles('admin', 'superadmin'),
//   async (req, res) => {
//     try {
//       const { name, category, amount, date, vendor, description } = req.body;

//       if (!name || !category || !amount || !date) {
//         return res.status(400).json({
//           message: 'Name, category, amount and date are required'
//         });
//       }

//       // Check if category exists in budget
//       const budgetCategory = await Budget.findOne({ category: category.trim() });
//       if (!budgetCategory) {
//         return res.status(400).json({
//           message: 'Category does not exist in budget. Please add category in budget first.'
//         });
//       }

//       // Check if budget has enough remaining
//       const remaining = budgetCategory.remaining || budgetCategory.allocated;
//       if (amount > remaining) {
//         return res.status(400).json({
//           message: `Insufficient budget. Remaining for ${category}: ₹${remaining}`
//         });
//       }

//       const expense = new Expense({
//         name,
//         category: category.trim(),
//         amount,
//         date,
//         vendor: vendor || '',
//         description: description || '',
//         createdBy: req.user.userId,
//         status: req.user.role === 'superadmin' ? 'approved' : 'pending' // Auto-approve for superadmin
//       });

//       const savedExpense = await expense.save();

//       // If superadmin adds expense, auto-update budget
//       if (req.user.role === 'superadmin') {
//         await updateBudgetRemaining(category.trim(), amount);
//       }

//       await Activity.create({
//         type: 'Expense Added',
//         user: req.user.idCardNo,
//         details: `₹${savedExpense.amount} spent on ${savedExpense.name} (${savedExpense.category}) - Status: ${savedExpense.status}`
//       });

//       res.status(201).json(savedExpense);

//     } catch (err) {
//       console.error('ADD EXPENSE ERROR:', err);
//       res.status(500).json({ message: 'Failed to add expense' });
//     }
//   }
// );

// /* =========================
//    APPROVE EXPENSE (SUPERADMIN ONLY)
// ========================= */
// router.put(
//   '/:id/approve',
//   verifyToken,
//   allowRoles('superadmin'),
//   async (req, res) => {
//     try {
//       const expense = await Expense.findById(req.params.id);
      
//       if (!expense) {
//         return res.status(404).json({ message: 'Expense not found' });
//       }

//       if (expense.status === 'approved') {
//         return res.status(400).json({ message: 'Expense already approved' });
//       }

//       // Check budget before approving
//       const budget = await Budget.findOne({ category: expense.category });
//       if (!budget) {
//         return res.status(400).json({
//           message: `Budget category "${expense.category}" not found`
//         });
//       }

//       const remaining = budget.remaining || budget.allocated;
//       if (expense.amount > remaining) {
//         return res.status(400).json({
//           message: `Cannot approve. Insufficient budget. Remaining: ₹${remaining}`
//         });
//       }

//       // Update expense status
//       expense.status = 'approved';
//       expense.approvedBy = req.user.userId;
//       expense.approvedAt = new Date();
      
//       const updatedExpense = await expense.save();

//       // ✅ CRITICAL: Update budget remaining amount
//       await updateBudgetRemaining(expense.category, expense.amount);

//       await Activity.create({
//         type: 'Expense Approved',
//         user: req.user.idCardNo,
//         details: `Approved expense ₹${expense.amount} for ${expense.category} - ${expense.name}`
//       });

//       res.json({
//         message: 'Expense approved successfully',
//         expense: updatedExpense
//       });

//     } catch (err) {
//       console.error('APPROVE EXPENSE ERROR:', err);
//       res.status(500).json({ message: 'Failed to approve expense' });
//     }
//   }
// );

// /* =========================
//    REJECT EXPENSE (SUPERADMIN ONLY)
// ========================= */
// router.put(
//   '/:id/reject',
//   verifyToken,
//   allowRoles('superadmin'),
//   async (req, res) => {
//     try {
//       const expense = await Expense.findById(req.params.id);
      
//       if (!expense) {
//         return res.status(404).json({ message: 'Expense not found' });
//       }

//       expense.status = 'rejected';
//       const updatedExpense = await expense.save();

//       await Activity.create({
//         type: 'Expense Rejected',
//         user: req.user.idCardNo,
//         details: `Rejected expense: ${expense.name} (₹${expense.amount})`
//       });

//       res.json({
//         message: 'Expense rejected',
//         expense: updatedExpense
//       });

//     } catch (err) {
//       console.error('REJECT EXPENSE ERROR:', err);
//       res.status(500).json({ message: 'Failed to reject expense' });
//     }
//   }
// );

// /* =========================
//    UPDATE EXPENSE (ADMIN + SUPERADMIN)
// ========================= */
// router.put(
//   '/:id',
//   verifyToken,
//   allowRoles('admin', 'superadmin'),
//   async (req, res) => {
//     try {
//       const expense = await Expense.findById(req.params.id);
      
//       if (!expense) {
//         return res.status(404).json({ message: 'Expense not found' });
//       }

//       // Store old values for budget adjustment
//       const oldAmount = expense.amount;
//       const oldCategory = expense.category;
//       const oldStatus = expense.status;

//       // Update expense
//       const updatedExpense = await Expense.findByIdAndUpdate(
//         req.params.id,
//         req.body,
//         { new: true }
//       );

//       // If expense was approved and amount/category changed, adjust budget
//       if (oldStatus === 'approved') {
//         // Reverse old amount from old category (add back to budget)
//         await updateBudgetRemaining(oldCategory, -oldAmount);
        
//         // Add new amount to new category if approved
//         if (updatedExpense.status === 'approved') {
//           await updateBudgetRemaining(updatedExpense.category, updatedExpense.amount);
//         }
//       }

//       await Activity.create({
//         type: 'Expense Updated',
//         user: req.user.idCardNo,
//         details: `Updated expense: ${updatedExpense.name}`
//       });

//       res.json(updatedExpense);

//     } catch (err) {
//       console.error('UPDATE EXPENSE ERROR:', err);
//       res.status(500).json({ message: 'Failed to update expense' });
//     }
//   }
// );

// /* =========================
//    DELETE EXPENSE (SUPERADMIN)
// ========================= */
// router.delete(
//   '/:id',
//   verifyToken,
//   allowRoles('superadmin'),
//   async (req, res) => {
//     try {
//       const expense = await Expense.findById(req.params.id);
      
//       if (!expense) {
//         return res.status(404).json({ message: 'Expense not found' });
//       }

//       // If expense was approved, add back to budget
//       if (expense.status === 'approved') {
//         await updateBudgetRemaining(expense.category, -expense.amount);
//       }

//       await Expense.findByIdAndDelete(req.params.id);

//       await Activity.create({
//         type: 'Expense Deleted',
//         user: req.user.idCardNo,
//         details: `Expense deleted: ${expense.name} (₹${expense.amount})`
//       });

//       res.json({ message: 'Expense deleted successfully' });

//     } catch (err) {
//       console.error('DELETE EXPENSE ERROR:', err);
//       res.status(500).json({ message: 'Failed to delete expense' });
//     }
//   }
// );

// /* =========================
//    GET BUDGET CATEGORIES FOR EXPENSE FORM
// ========================= */
// router.get('/budget-categories', verifyToken, async (req, res) => {
//   try {
//     const categories = await Budget.distinct('category');
//     res.json(categories);
//   } catch (err) {
//     console.error('GET CATEGORIES ERROR:', err);
//     res.status(500).json({ message: 'Failed to load categories' });
//   }
// });

// /* =========================
//    HELPER FUNCTION: Update Budget Remaining
// ========================= */
// async function updateBudgetRemaining(category, amount) {
//   try {
//     // Find budget for this category
//     const budget = await Budget.findOne({ category });
    
//     if (!budget) {
//       console.warn(`No budget found for category: ${category}`);
//       return;
//     }

//     // Update spent amount (add expense amount)
//     budget.spent = (budget.spent || 0) + amount;
    
//     // Ensure spent doesn't go negative
//     if (budget.spent < 0) budget.spent = 0;
//     if (budget.spent > budget.allocated) budget.spent = budget.allocated;
    
//     // Recalculate remaining
//     budget.remaining = budget.allocated - budget.spent;
    
//     await budget.save();
    
//     console.log(`✅ Budget updated: ${category} - Spent: ${budget.spent}, Remaining: ${budget.remaining}`);
//   } catch (error) {
//     console.error('UPDATE BUDGET ERROR:', error);
//     throw error;
//   }
// }

// module.exports = router;