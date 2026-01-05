const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const ExcelItem = require('../models/ExcelItem');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/import', upload.single('file'), async (req, res) => {
    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        await ExcelItem.deleteMany({});

        const items = data.map(row => ({
            itemName: row['Item Name'],
            category: row['Category'],
            quantity: row['Quantity'],
            unitPrice: row['Unit Price'],
            totalPrice: row['Total Price'],
            vendor: row['Vendor'],
            status: row['Status'] || 'pending'
        }));

        await ExcelItem.insertMany(items);

        res.json({ message: 'Excel imported successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Excel import failed' });
    }
});

module.exports = router;
