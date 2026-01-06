// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/user');

// // ✅ USE ENV SECRET (must match middleware)
// const JWT_SECRET = process.env.JWT_SECRET || 'club_secret_key';

// // 🔥 DEBUG
// console.log('🔥 authRoutes loaded');

// /**
//  * =========================
//  * LOGIN ROUTE
//  * =========================
//  */
// router.post('/login', async (req, res) => {
//   console.log('🔥 LOGIN API HIT', req.body);

//   try {
//     const { idCardNo, mobile } = req.body;

//     if (!idCardNo || !mobile) {
//       return res.status(400).json({
//         message: 'ID Card number and Mobile number are required'
//       });
//     }

//     const user = await User.findOne({
//       idCardNo: idCardNo.toString().trim(),
//       mobile: mobile.toString().trim()
//     });

//     if (!user) {
//       return res.status(401).json({
//         message: 'Invalid ID Card or Mobile number'
//       });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({
//         message: 'Account is inactive. Contact Super Admin.'
//       });
//     }

//     // 🔐 JWT
//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role,
//         idCardNo: user.idCardNo
//       },
//       JWT_SECRET,
//       { expiresIn: '1d' }
//     );

//     // ✅ VERY IMPORTANT: token INSIDE user
//     return res.json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//         idCardNo: user.idCardNo,
//         token // 🔥 THIS FIXES SESSION EXPIRY
//       }
//     });

//   } catch (error) {
//     console.error('❌ LOGIN ERROR:', error);
//     return res.status(500).json({
//       message: 'Server error during login'
//     });
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Admin = require('../models/Admin'); // ✅ IMPORTANT
const Member = require('../models/member');

const JWT_SECRET = process.env.JWT_SECRET || 'club_secret_key';

console.log('🔥 authRoutes loaded');

/* =========================
   LOGIN ROUTE (FIXED)
========================= */
router.post('/login', async (req, res) => {
  try {
    let { idCardNo, mobile } = req.body;

    if (!idCardNo || !mobile) {
      return res.status(400).json({
        message: 'ID Card number and Mobile number are required'
      });
    }

    idCardNo = idCardNo.trim();
    mobile = mobile.trim();

    let user = null;
    let role = null;

    /* =========================
       1️⃣ CHECK ADMIN
    ========================= */
    user = await Admin.findOne({
      idCardNo,
      mobile,
      status: 'active'
    });

    if (user) {
      role = user.role; // admin / superadmin
    }

    /* =========================
       2️⃣ CHECK USER (if used)
    ========================= */
    if (!user) {
      user = await User.findOne({
        idCardNo,
        mobile,
        isActive: true
      });
      if (user) role = user.role;
    }

    /* =========================
       3️⃣ CHECK MEMBER
    ========================= */
    if (!user) {
      user = await Member.findOne({
        idCardNo,
        mobile,
        status: 'active'
      });
      if (user) role = 'member';
    }

    /* =========================
       ❌ NOT FOUND
    ========================= */
    if (!user) {
      return res.status(401).json({
        message: 'Invalid ID Card or Mobile number'
      });
    }

    /* =========================
       🔐 TOKEN
    ========================= */
    const token = jwt.sign(
      {
        userId: user._id,
        role,
        idCardNo: user.idCardNo
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role,
        idCardNo: user.idCardNo
      }
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    return res.status(500).json({
      message: 'Server error during login'
    });
  }
});


module.exports = router;
