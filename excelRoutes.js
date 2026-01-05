const express = require('express');
const ExcelItem = require('../models/Excelitem');

const router = express.Router();

/* GET all excel items */
router.get('/', async (req, res) => {
    const items = await ExcelItem.find().sort({ createdAt: -1 });
    res.json(items);
});

/* SAVE all items */
router.post('/', async (req, res) => {
    await ExcelItem.deleteMany({});
    await ExcelItem.insertMany(req.body);
    res.json({ message: 'Excel items saved' });
});

/* DELETE all */
router.delete('/', async (req, res) => {
    await ExcelItem.deleteMany({});
    res.json({ message: 'All items cleared' });
});

module.exports = router;
