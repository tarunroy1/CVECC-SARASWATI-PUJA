const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  idCardNo: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  mobile: String,
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'member'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.User ||
  mongoose.model('User', userSchema);
