const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Activity = require('../models/activity');
const { verifyToken, allowRoles } = require('../middleware/auth');

/* =========================
   GET ALL ADMINS
========================= */
router.get('/', verifyToken, async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error('GET ADMINS ERROR:', err);
    res.status(500).json({ message: 'Failed to load admins' });
  }
});

/* =========================
   ADD ADMIN (SUPERADMIN ONLY)
========================= */
router.post(
  '/',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const { idCardNo, name, mobile, role, addedDate, status } = req.body;

      if (!idCardNo || !name || !mobile || !role || !addedDate) {
        return res.status(400).json({
          message: 'All fields are required'
        });
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ idCardNo });
      if (existingAdmin) {
        return res.status(400).json({
          message: 'Admin with this ID card number already exists'
        });
      }

      const admin = new Admin({
        idCardNo,
        name,
        mobile,
        role,
        addedDate,
        status: status || 'active'
      });

      const savedAdmin = await admin.save();

      await Activity.create({
        type: 'Admin Added',
        user: req.user.idCardNo,
        details: `Added new admin: ${savedAdmin.name} (${savedAdmin.role})`
      });

      res.status(201).json(savedAdmin);

    } catch (err) {
      console.error('ADD ADMIN ERROR:', err);
      res.status(500).json({ message: 'Failed to add admin' });
    }
  }
);

/* =========================
   UPDATE ADMIN (SUPERADMIN)
========================= */
router.put(
  '/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const updatedAdmin = await Admin.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedAdmin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      await Activity.create({
        type: 'Admin Updated',
        user: req.user.idCardNo,
        details: `Updated admin: ${updatedAdmin.name}`
      });

      res.json(updatedAdmin);

    } catch (err) {
      console.error('UPDATE ADMIN ERROR:', err);
      res.status(500).json({ message: 'Failed to update admin' });
    }
  }
);

/* =========================
   DELETE ADMIN (SUPERADMIN)
========================= */
router.delete(
  '/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const deletedAdmin = await Admin.findByIdAndDelete(req.params.id);

      if (!deletedAdmin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      await Activity.create({
        type: 'Admin Deleted',
        user: req.user.idCardNo,
        details: `Deleted admin: ${deletedAdmin.name}`
      });

      res.json({ message: 'Admin deleted successfully' });

    } catch (err) {
      console.error('DELETE ADMIN ERROR:', err);
      res.status(500).json({ message: 'Failed to delete admin' });
    }
  }
);

//member
// routes/adminRoutes.js
// const express = require('express');
// const router = express.Router();
const Member = require('../models/member');

/* =========================
   GET ALL MEMBERS (ADMIN)
========================= */
router.get('/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json({ members });
  } catch (err) {
    console.error('ADMIN FETCH MEMBERS ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

/* =========================
   DELETE MEMBER (SUPERADMIN)
========================= */
router.delete(
  '/members/:id',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      const deletedMember = await Member.findByIdAndDelete(req.params.id);

      if (!deletedMember) {
        return res.status(404).json({ message: 'Member not found' });
      }

      await Activity.create({
        type: 'Member Deleted',
        user: req.user.idCardNo,
        details: `Deleted member: ${deletedMember.name}`
      });

      res.json({ message: 'Member deleted successfully' });

    } catch (err) {
      console.error('DELETE MEMBER ERROR:', err);
      res.status(500).json({ message: 'Failed to delete member' });
    }
  }
);


module.exports = router;
