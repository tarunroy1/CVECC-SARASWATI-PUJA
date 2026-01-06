const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { verifyToken } = require('../middleware/auth');

const Donation = require('../models/Donations');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Admin = require('../models/Admin');

router.get('/:type', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;

    let data = [];
    let columns = [];

    switch (type) {
      case 'donations':
        data = await Donation.find();
        columns = [
          { header: 'Donor Name', key: 'donorName' },
          { header: 'Amount', key: 'amount' },
          { header: 'Date', key: 'date' },
          { header: 'Payment Method', key: 'paymentMethod' },
          { header: 'Status', key: 'status' }
        ];
        break;

      case 'expenses':
        data = await Expense.find();
        columns = [
          { header: 'Expense Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Amount', key: 'amount' },
          { header: 'Date', key: 'date' },
          { header: 'Status', key: 'status' }
        ];
        break;

      case 'budgets':
        data = await Budget.find();
        columns = [
          { header: 'Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Allocated', key: 'allocated' },
          { header: 'Spent', key: 'spent' },
          { header: 'Remaining', key: 'remaining' }
        ];
        break;

      case 'admins':
        data = await Admin.find();
        columns = [
          { header: 'ID Card', key: 'idCardNo' },
          { header: 'Name', key: 'name' },
          { header: 'Mobile', key: 'mobile' },
          { header: 'Role', key: 'role' },
          { header: 'Status', key: 'status' }
        ];
        break;

      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type.toUpperCase());

    sheet.columns = columns;
    sheet.addRows(data);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type}-report.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('EXPORT ERROR:', err);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
