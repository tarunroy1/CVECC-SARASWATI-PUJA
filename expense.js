const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  vendor: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Add index for faster queries
expenseSchema.index({ category: 1, status: 1, date: -1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);


// const mongoose = require('mongoose');

// const expenseSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   category: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   amount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   date: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   vendor: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   description: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   approvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   approvedAt: {
//     type: Date
//   }
// }, { 
//   timestamps: true 
// });

// // Add index for faster queries
// expenseSchema.index({ category: 1, status: 1, date: -1 });

// module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
