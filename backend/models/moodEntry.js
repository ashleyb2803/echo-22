const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moodEntrySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: Number, required: true }, // 1 to 5 scale
  journal: { type: String },
  affirmation: { type: String }, // generated AI response
}, {
  timestamps: true // adds createdAt & updatedAt
});

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
