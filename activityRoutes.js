// const express = require('express');
// const router = express.Router();
// const Activity = require('../models/activity');

// /**
//  * GET recent activities
//  */
// router.get('/', async (req, res) => {
//     try {
//         const activities = await Activity.find()
//             .sort({ date: -1 })
//             .limit(10);
//         res.json(activities);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const { verifyToken } = require('../middleware/auth');

/* =========================
   GET RECENT ACTIVITIES
========================= */
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(activities);
  } catch (err) {
    console.error('GET ACTIVITIES ERROR:', err);
    res.status(500).json({ message: 'Failed to load activities' });
  }
});

module.exports = router;