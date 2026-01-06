
// const mongoose = require('mongoose');

// const donationSchema = new mongoose.Schema({
//   donorName: {
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
//   paymentMethod: {
//     type: String,
//     required: true,
//     enum: ['cash', 'bank', 'upi', 'cheque']
//   },
//   note: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, { 
//   timestamps: true 
// });

// module.exports = mongoose.models.Donation || mongoose.model('Donation', donationSchema);

const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: {
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
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'bank', 'upi', 'cheque']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },

  // 🔥 ADD THIS (IMPORTANT)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

module.exports =
  mongoose.models.Donation || mongoose.model('Donation', donationSchema);
