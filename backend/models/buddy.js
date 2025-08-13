const mongoose = require('mongoose');

// Buddy relationship model
const buddySchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  permissions: {
    shareMoodData: {
      type: Boolean,
      default: true
    },
    allowFlareSignals: {
      type: Boolean,
      default: true
    },
    shareJournalEntries: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Ensure no duplicate buddy relationships
buddySchema.index(
  { requester: 1, recipient: 1 }, 
  { unique: true }
);

// Generate unique invite code
buddySchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.inviteCode = code;
  return code;
};

// Flare signal model for urgent check-ins
const flareSignalSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    maxLength: 200,
    default: 'Your buddy needs support right now.'
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'crisis'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  respondedAt: {
    type: Date
  },
  response: {
    type: String,
    maxLength: 500
  }
}, {
  timestamps: true
});

// Check-in share model for daily mood sharing
const checkInShareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moodEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodEntry',
    required: true
  },
  shareDate: {
    type: Date,
    default: Date.now
  },
  isViewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Buddy = mongoose.model('Buddy', buddySchema);
const FlareSignal = mongoose.model('FlareSignal', flareSignalSchema);
const CheckInShare = mongoose.model('CheckInShare', checkInShareSchema);

module.exports = {
  Buddy,
  FlareSignal,
  CheckInShare
};