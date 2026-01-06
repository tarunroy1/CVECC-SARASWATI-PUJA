// const express = require('express');
// const router = express.Router();
// const Donation = require('../models/donations');
// const Activity = require('../models/activity');

// /**
//  * GET all donations
//  */
// router.get('/', async (req, res) => {
//     try {
//         const donations = await Donation.find().sort({ createdAt: -1 });
//         res.json(donations);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// /**
//  * GET single donation by ID
//  */
// router.get('/:id', async (req, res) => {
//     try {
//         const donation = await Donation.findById(req.params.id);
//         if (!donation) {
//             return res.status(404).json({ message: 'Donation not found' });
//         }
//         res.json(donation);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// /**
//  * CREATE new donation + Activity log
//  */
// router.post('/', async (req, res) => {
//     try {
//         const donation = new Donation({
//             donorName: req.body.donorName,
//             amount: req.body.amount,
//             date: req.body.date,
//             paymentMethod: req.body.paymentMethod,
//             note: req.body.note || ''
//         });

//         const savedDonation = await donation.save();

//         // Log activity
//         await Activity.create({
//             type: 'Donation Added',
//             user: 'Admin',
//             details: `₹${savedDonation.amount} received from ${savedDonation.donorName}`
//         });

//         res.status(201).json(savedDonation);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// /**
//  * UPDATE donation + Activity log
//  */
// router.put('/:id', async (req, res) => {
//     try {
//         const updatedDonation = await Donation.findByIdAndUpdate(
//             req.params.id,
//             req.body,
//             { new: true }
//         );

//         if (!updatedDonation) {
//             return res.status(404).json({ message: 'Donation not found' });
//         }

//         // Log activity
//         await Activity.create({
//             type: 'Donation Updated',
//             user: 'Admin',
//             details: `Donation updated for ${updatedDonation.donorName}`
//         });

//         res.json(updatedDonation);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// /**
//  * DELETE donation + Activity log
//  */
// router.delete('/:id', async (req, res) => {
//     try {
//         const deletedDonation = await Donation.findByIdAndDelete(req.params.id);

//         if (!deletedDonation) {
//             return res.status(404).json({ message: 'Donation not found' });
//         }

//         // Log activity
//         await Activity.create({
//             type: 'Donation Deleted',
//             user: 'Admin',
//             details: `Donation deleted for ${deletedDonation.donorName}`
//         });

//         res.json({ message: 'Donation deleted successfully' });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Donation = require('../models/Donations');
const Activity = require('../models/activity');
const { verifyToken, allowRoles } = require('../middleware/auth');

/* =========================
   GET ALL DONATIONS
========================= */
router.get('/', verifyToken, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ date: -1 });
    res.json(donations);
  } catch (err) {
    console.error('GET DONATIONS ERROR:', err);
    res.status(500).json({ message: 'Failed to load donations' });
  }
});

/* =========================
   ADD DONATION (ADMIN + SUPERADMIN)
========================= */
router.post(
  '/',
  verifyToken,
  allowRoles('admin', 'superadmin'),
  async (req, res) => {
    try {
      const { donorName, amount, date, paymentMethod, note } = req.body;

      if (!donorName || !amount || !date || !paymentMethod) {
        return res.status(400).json({
          message: 'Donor name, amount, date and payment method are required'
        });
      }

      const donation = new Donation({
        donorName,
        amount,
        date,
        paymentMethod,
        note: note || '',
        createdBy: req.user.userId
      });

      const savedDonation = await donation.save();

      await Activity.create({
        type: 'Donation Added',
        user: req.user.idCardNo,
        details: `New donation: ₹${savedDonation.amount} from ${savedDonation.donorName}`
      });

      res.status(201).json(savedDonation);

    } catch (err) {
      console.error('ADD DONATION ERROR:', err);
      res.status(500).json({ message: 'Failed to add donation' });
    }
  }
);

/* =========================
   UPDATE DONATION (ADMIN + SUPERADMIN)
========================= */
router.put(
  '/:id',
  verifyToken,
  allowRoles('admin', 'superadmin'),
  async (req, res) => {
    try {
      const donationId = req.params.id;
      const updateData = req.body;

      const updatedDonation = await Donation.findByIdAndUpdate(
        donationId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedDonation) {
        return res.status(404).json({ message: 'Donation not found' });
      }

      await Activity.create({
        type: 'Donation Updated',
        user: req.user.idCardNo,
        details: `Updated donation: ₹${updatedDonation.amount} from ${updatedDonation.donorName}`
      });

      res.json(updatedDonation);

    } catch (err) {
      console.error('UPDATE DONATION ERROR:', err);
      res.status(500).json({ message: 'Failed to update donation' });
    }
  }
);

/* =========================
   APPROVE DONATION (SUPERADMIN ONLY)
========================= */
router.put(
  '/:id/approve',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const donation = await Donation.findById(req.params.id);

      if (!donation) {
        return res.status(404).json({ message: 'Donation not found' });
      }

      if (donation.status === 'approved') {
        return res.status(400).json({ message: 'Donation already approved' });
      }

      donation.status = 'approved';
      await donation.save();

      await Activity.create({
        type: 'Donation Approved',
        user: req.user.idCardNo,
        details: `Approved donation: ₹${donation.amount} from ${donation.donorName}`
      });

      res.json({ message: 'Donation approved successfully', donation });

    } catch (err) {
      console.error('APPROVE DONATION ERROR:', err);
      res.status(500).json({ message: 'Failed to approve donation' });
    }
  }
);

/* =========================
   REJECT DONATION (SUPERADMIN ONLY)
========================= */
router.put(
  '/:id/reject',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const donation = await Donation.findById(req.params.id);

      if (!donation) {
        return res.status(404).json({ message: 'Donation not found' });
      }

      donation.status = 'rejected';
      await donation.save();

      await Activity.create({
        type: 'Donation Rejected',
        user: req.user.idCardNo,
        details: `Rejected donation: ₹${donation.amount} from ${donation.donorName}`
      });

      res.json({ message: 'Donation rejected', donation });

    } catch (err) {
      console.error('REJECT DONATION ERROR:', err);
      res.status(500).json({ message: 'Failed to reject donation' });
    }
  }
);

/* =========================
   DELETE DONATION (SUPERADMIN ONLY)
========================= */
router.delete(
  '/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const donationId = req.params.id;
      const deletedDonation = await Donation.findByIdAndDelete(donationId);

      if (!deletedDonation) {
        return res.status(404).json({ message: 'Donation not found' });
      }

      await Activity.create({
        type: 'Donation Deleted',
        user: req.user.idCardNo,
        details: `Deleted donation: ₹${deletedDonation.amount} from ${deletedDonation.donorName}`
      });

      res.json({ message: 'Donation deleted successfully' });

    } catch (err) {
      console.error('DELETE DONATION ERROR:', err);
      res.status(500).json({ message: 'Failed to delete donation' });
    }
  }
);

/* =========================
   GET SINGLE DONATION FOR EDITING
========================= */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json(donation);
  } catch (err) {
    console.error('GET SINGLE DONATION ERROR:', err);
    res.status(500).json({ message: 'Failed to load donation' });
  }
});

module.exports = router;
