const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
    // REMOVE unique: true if it's causing duplicate index warnings
  },
  allocated: {
    type: Number,
    required: true,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining: {
    type: Number,
    default: function() {
      return this.allocated - (this.spent || 0);
    }
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});
//save
budgetSchema.pre('save', function () {
  this.remaining = this.allocated - (this.spent || 0);
});


// Alternative: Remove pre-save hook and use virtual/setter
budgetSchema.methods.updateRemaining = function() {
  this.remaining = this.allocated - (this.spent || 0);
  return this.remaining;
};

// Add index (but be careful not to duplicate)
// budgetSchema.index({ category: 1 });

module.exports = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

// const mongoose = require('mongoose');

// const budgetSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   category: {
//     type: String,
//     required: true,
//     trim: true,
//     unique: true // Each category should be unique
//   },
//   allocated: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   spent: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   remaining: {
//     type: Number,
//     default: function() {
//       return this.allocated - (this.spent || 0);
//     }
//   },
//   date: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   description: {
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

// // Auto-calculate remaining before save
// budgetSchema.pre('save', function(next) {
//   this.remaining = this.allocated - (this.spent || 0);
//   next();
// });

// module.exports = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
