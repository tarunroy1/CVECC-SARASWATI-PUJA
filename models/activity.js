// const mongoose = require('mongoose');

// const activitySchema = new mongoose.Schema({
//     type: {
//         type: String,
//         required: true
//     },
//     user: {
//         type: String,
//         default: 'Admin'
//     },
//     details: {
//         type: String,
//         required: true
//     },
//     date: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports =
//     mongoose.models.Activity ||
//     mongoose.model('Activity', activitySchema);

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
