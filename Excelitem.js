// const mongoose = require('mongoose');

// const excelItemSchema = new mongoose.Schema({
//     itemName: String,
//     category: String,
//     quantity: Number,
//     unitPrice: Number,
//     totalPrice: Number,
//     vendor: String,
//     status: {
//         type: String,
//         default: 'pending'
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports =
//     mongoose.models.ExcelItem ||
//     mongoose.model('ExcelItem', excelItemSchema);

const mongoose = require('mongoose');

const excelItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    category: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    vendor: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

excelItemSchema.pre('save', function (next) {
  this.totalPrice = this.quantity * this.unitPrice;
  next();
});


module.exports =
    mongoose.models.ExcelItem ||
    mongoose.model('ExcelItem', excelItemSchema);
