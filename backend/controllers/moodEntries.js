const MoodEntry = require('../models/moodEntry');

async function create(req, res) {
  try {
    const entry = await MoodEntry.create({
      user: req.user._id,
      mood: req.body.mood,
      journal: req.body.journal || '',
      affirmation: req.body.affirmation || '', // will come from AI
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function index(req, res) {
  try {
    const entries = await MoodEntry.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(7);
    res.json(entries);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  create,
  index
};
