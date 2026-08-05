const express = require('express');
const router = express.Router();
const Member = require('../models/member');

/* =========================
   MEMBER SIGNUP
========================= */
router.post('/signup', async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        message: 'Name and mobile number are required'
      });
    }

    // 🔒 Check if mobile already exists
    const existingMember = await Member.findOne({ mobile: mobile.trim() });
    if (existingMember) {
      return res.status(400).json({
        message: 'Mobile number already registered'
      });
    }

    // 🆔 Generate ID Card Number
    // const count = await Member.countDocuments();
    // const idCardNo = `MEM${(count + 1).toString().padStart(4, '0')}`;
    // 🆔 Generate Next Available ID Card Number
const lastMember = await Member.findOne().sort({ createdAt: -1 });

let nextNumber = 1;

if (lastMember && lastMember.idCardNo) {
    nextNumber = parseInt(lastMember.idCardNo.replace("MEM", "")) + 1;
}

const idCardNo = `MEM${String(nextNumber).padStart(4, "0")}`;

    const member = new Member({
      idCardNo,
      name: name.trim(),
      mobile: mobile.trim()
    });

    await member.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      idCardNo
    });

  } catch (error) {
    console.error("MEMBER SIGNUP ERROR:", error);

    res.status(500).json({
        message: error.message,
        error: error
    });
}
});

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const Member = require('../models/member');

// /* =========================
//    MEMBER SIGNUP
// ========================= */
// router.post('/signup', async (req, res) => {
//   try {
//     const { name, mobile } = req.body;

//     if (!name || !mobile) {
//       return res.status(400).json({
//         message: 'Name and mobile number are required'
//       });
//     }

//     // 🔒 Check if mobile already exists
//     const existingMember = await Member.findOne({ mobile: mobile.trim() });
//     if (existingMember) {
//       return res.status(400).json({
//         message: 'Mobile number already registered'
//       });
//     }

//     // 🆔 Generate ID Card Number
//     const count = await Member.countDocuments();
//     const idCardNo = `MEM${(count + 1).toString().padStart(4, '0')}`;

//     const member = new Member({
//       idCardNo,
//       name: name.trim(),
//       mobile: mobile.trim()
//     });

//     await member.save();

//     res.status(201).json({
//       success: true,
//       message: 'Account created successfully',
//       idCardNo
//     });

//   } catch (error) {
//     console.error('MEMBER SIGNUP ERROR:', error);
//     res.status(500).json({
//       message: 'Failed to create member'
//     });
//   }
// });

// module.exports = router;
