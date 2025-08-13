const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  note: {
    type: String,
    maxLength: 500,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Store just the date part for easy querying
  dateString: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure one mood entry per user per day
moodEntrySchema.index({ user: 1, dateString: 1 }, { unique: true });

// Static method to get mood entries for a date range
moodEntrySchema.statics.getMoodRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to check if user has entry for today
moodEntrySchema.statics.hasTodayEntry = function(userId) {
  const today = new Date().toISOString().split('T')[0];
  return this.findOne({
    user: userId,
    dateString: today
  });
};

// Pre-save middleware to set dateString
moodEntrySchema.pre('save', function(next) {
  if (this.date) {
    this.dateString = this.date.toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('MoodEntry', moodEntrySchema);