const express = require('express');
const router = express.Router();
const ExcelItem = require('../models/Excelitem'); // ✅ FIXED CASE
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');

const { verifyToken, allowRoles } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

/**
 * =========================
 * GET all excel items (ALL ROLES)
 * =========================
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await ExcelItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load excel items' });
  }
});

/**
 * =========================
 * SAVE all excel items (ADMIN + SUPERADMIN)
 * =========================
 */
router.post(
  '/',
  verifyToken,
  allowRoles('admin', 'superadmin'),
  async (req, res) => {
    try {
      await ExcelItem.deleteMany({});
      await ExcelItem.insertMany(req.body);
      res.json({ message: 'Excel items saved successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to save excel items' });
    }
  }
);

/**
 * =========================
 * DELETE all excel items (SUPERADMIN ONLY)
 * =========================
 */
router.delete(
  '/',
  verifyToken,
  allowRoles('superadmin'),
  async (req, res) => {
    try {
      await ExcelItem.deleteMany({});
      res.json({ message: 'All excel items cleared' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to clear excel items' });
    }
  }
);

/**
 * =========================
 * IMPORT EXCEL FILE
 * =========================
 */
router.post(
  '/import',
  verifyToken,
  allowRoles('admin', 'superadmin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);

      const sheet = workbook.worksheets[0];
      const items = [];

      sheet.eachRow((row, index) => {
        if (index === 1) return;

        const quantity = Number(row.getCell(3).value) || 1;
        const unitPrice = Number(row.getCell(4).value) || 0;

        items.push({
          itemName: row.getCell(1).value,
          category: row.getCell(2).value || '',
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          vendor: row.getCell(5).value || '',
          status: (row.getCell(6).value || 'pending').toLowerCase()
        });
      });

      await ExcelItem.deleteMany({});
      await ExcelItem.insertMany(items);

      fs.unlinkSync(req.file.path); // 🔥 cleanup uploaded file

      res.json({ message: 'Excel file imported successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to import excel file' });
    }
  }
);

/**
 * =========================
 * EXPORT TO EXCEL
 * =========================
 */
router.get('/export', verifyToken, async (req, res) => {
  try {
    const items = await ExcelItem.find();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Excel Items');

    sheet.columns = [
      { header: 'Item Name', key: 'itemName', width: 25 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Price', key: 'unitPrice', width: 15 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    items.forEach(item => sheet.addRow(item));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=excel-items.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export excel file' });
  }
});

module.exports = router;
