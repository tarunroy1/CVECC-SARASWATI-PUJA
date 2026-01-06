const mongoose = require('mongoose'); // ✅ THIS LINE WAS MISSING

const memberSchema = new mongoose.Schema({
  idCardNo: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports =
  mongoose.models.Member || mongoose.model('Member', memberSchema);
