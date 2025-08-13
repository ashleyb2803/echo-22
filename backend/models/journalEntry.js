const mongoose = require('mongoose');
const crypto = require('crypto');

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    maxLength: 200,
    default: ''
  },
  // Encrypted content for privacy
  encryptedContent: {
    type: String,
    required: true
  },
  // IV for encryption
  iv: {
    type: String,
    required: true
  },
  // Content hash for integrity checking
  contentHash: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    maxLength: 50
  }],
  mood: {
    type: Number,
    min: 1,
    max: 5
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  // For sharing with buddies if user chooses
  sharedWith: [{
    buddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Encrypt content before saving
journalEntrySchema.methods.encryptContent = function(content, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  this.encryptedContent = encrypted;
  this.iv = iv.toString('hex');
  this.contentHash = crypto.createHash('sha256').update(content).digest('hex');
};

// Decrypt content for reading
journalEntrySchema.methods.decryptContent = function(encryptionKey) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(this.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Verify integrity
    const hash = crypto.createHash('sha256').update(decrypted).digest('hex');
    if (hash !== this.contentHash) {
      throw new Error('Content integrity check failed');
    }
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt journal entry');
  }
};

// Static methods for querying
journalEntrySchema.statics.getEntriesByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

journalEntrySchema.statics.getEntriesByTags = function(userId, tags) {
  return this.find({
    user: userId,
    tags: { $in: tags }
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('JournalEntry', journalEntrySchema);