const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Activity = require('../models/activity');
const { verifyToken, allowRoles } = require('../middleware/auth');

/* =========================
   GET ALL BUDGET ITEMS
========================= */
router.get('/', verifyToken, async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ createdAt: -1 });
    res.json(budgets);
  } catch (err) {
    console.error('GET BUDGET ERROR:', err);
    res.status(500).json({ message: 'Failed to load budget items' });
  }
});

/* =========================
   ADD BUDGET ITEM (SUPERADMIN ONLY)
========================= */
router.post(
  '/',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const { name, category, allocated, date, description } = req.body;

      if (!name || !category || !allocated || !date) {
        return res.status(400).json({
          message: 'Name, category, allocated amount and date are required'
        });
      }

      const budget = new Budget({
        name: name.trim(),
        category: category.trim(),
        allocated: Number(allocated),
        date,
        description: description || '',
        createdBy: req.user.userId
      });

      const savedBudget = await budget.save();

      await Activity.create({
        type: 'Budget Added',
        user: req.user.idCardNo,
        details: `Added budget: ${savedBudget.name} - ₹${savedBudget.allocated}`
      });

      res.status(201).json(savedBudget);

    } catch (err) {
      console.error('ADD BUDGET ERROR:', err);
      res.status(500).json({ message: 'Failed to add budget item' });
    }
  }
);


/* =========================
   GET BUDGET CATEGORIES FOR EXPENSE FORM
========================= */
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const categories = await Budget.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('GET CATEGORIES ERROR:', err);
    res.status(500).json({ message: 'Failed to load categories' });
  }
});

/* =========================
   UPDATE BUDGET ITEM (SUPERADMIN)
========================= */
router.put(
  '/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      if (!budget) {
        return res.status(404).json({ message: 'Budget item not found' });
      }

      budget.name = req.body.name;
      budget.category = req.body.category;
      budget.allocated = req.body.allocated;
      budget.date = req.body.date;
      budget.description = req.body.description || '';

      // 🔥 IMPORTANT
      budget.remaining = budget.allocated - (budget.spent || 0);

      await budget.save(); // ✅ pre-save runs

      await Activity.create({
        type: 'Budget Updated',
        user: req.user.idCardNo,
        details: `Updated budget: ${budget.name}`
      });

      res.json(budget);

    } catch (err) {
      console.error('UPDATE BUDGET ERROR:', err);
      res.status(500).json({ message: 'Failed to update budget item' });
    }
  }
);


/* =========================
   DELETE BUDGET ITEM (SUPERADMIN)
========================= */
router.delete(
  '/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const deletedBudget = await Budget.findByIdAndDelete(req.params.id);

      if (!deletedBudget) {
        return res.status(404).json({ message: 'Budget item not found' });
      }

      await Activity.create({
        type: 'Budget Deleted',
        user: req.user.idCardNo,
        details: `Deleted budget: ${deletedBudget.name}`
      });

      res.json({ message: 'Budget item deleted successfully' });

    } catch (err) {
      console.error('DELETE BUDGET ERROR:', err);
      res.status(500).json({ message: 'Failed to delete budget item' });
    }
  }
);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const Budget = require('../models/Budget');
// const Activity = require('../models/activity');
// const { verifyToken, allowRoles } = require('../middleware/auth');

// /* =========================
//    GET ALL BUDGET ITEMS
// ========================= */
// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const budgets = await Budget.find().sort({ createdAt: -1 });
//     res.json(budgets);
//   } catch (err) {
//     console.error('GET BUDGET ERROR:', err);
//     res.status(500).json({ message: 'Failed to load budget items' });
//   }
// });

// /* =========================
//    ADD BUDGET ITEM (SUPERADMIN ONLY)
// ========================= */
// router.post(
//   '/',
//   verifyToken,
//   allowRoles('superadmin'),
//   async (req, res) => {
//     try {
//       const { name, category, allocated, date, description } = req.body;

//       if (!name || !category || !allocated || !date) {
//         return res.status(400).json({
//           message: 'Name, category, allocated amount and date are required'
//         });
//       }

//       // Check if category already exists
//       const existingCategory = await Budget.findOne({ category });
//       if (existingCategory) {
//         return res.status(400).json({
//           message: 'Category already exists. Please use a different category name.'
//         });
//       }

//       const budget = new Budget({
//         name,
//         category,
//         allocated,
//         date,
//         description: description || '',
//         spent: 0,
//         createdBy: req.user.userId
//       });

//       const savedBudget = await budget.save();

//       await Activity.create({
//         type: 'Budget Added',
//         user: req.user.idCardNo,
//         details: `Added budget: ${savedBudget.name} - ₹${savedBudget.allocated} for ${savedBudget.category}`
//       });

//       res.status(201).json(savedBudget);

//     } catch (err) {
//       console.error('ADD BUDGET ERROR:', err);
//       res.status(500).json({ message: 'Failed to add budget item' });
//     }
//   }
// );

// /* =========================
//    GET BUDGET CATEGORIES FOR EXPENSE FORM
// ========================= */
// router.get('/categories', verifyToken, async (req, res) => {
//   try {
//     const categories = await Budget.distinct('category');
//     res.json(categories);
//   } catch (err) {
//     console.error('GET CATEGORIES ERROR:', err);
//     res.status(500).json({ message: 'Failed to load categories' });
//   }
// });

// /* =========================
//    UPDATE BUDGET ITEM (SUPERADMIN)
// ========================= */
// router.put(
//   '/:id',
//   verifyToken,
//   allowRoles('superadmin'),
//   async (req, res) => {
//     try {
//       const updatedBudget = await Budget.findByIdAndUpdate(
//         req.params.id,
//         req.body,
//         { new: true }
//       );

//       if (!updatedBudget) {
//         return res.status(404).json({ message: 'Budget item not found' });
//       }

//       await Activity.create({
//         type: 'Budget Updated',
//         user: req.user.idCardNo,
//         details: `Updated budget: ${updatedBudget.name}`
//       });

//       res.json(updatedBudget);

//     } catch (err) {
//       console.error('UPDATE BUDGET ERROR:', err);
//       res.status(500).json({ message: 'Failed to update budget item' });
//     }
//   }
// );

// /* =========================
//    DELETE BUDGET ITEM (SUPERADMIN)
// ========================= */
// router.delete(
//   '/:id',
//   verifyToken,
//   allowRoles('superadmin'),
//   async (req, res) => {
//     try {
//       const deletedBudget = await Budget.findByIdAndDelete(req.params.id);

//       if (!deletedBudget) {
//         return res.status(404).json({ message: 'Budget item not found' });
//       }

//       await Activity.create({
//         type: 'Budget Deleted',
//         user: req.user.idCardNo,
//         details: `Deleted budget: ${deletedBudget.name}`
//       });

//       res.json({ message: 'Budget item deleted successfully' });

//     } catch (err) {
//       console.error('DELETE BUDGET ERROR:', err);
//       res.status(500).json({ message: 'Failed to delete budget item' });
//     }
//   }
// );

// module.exports = router;