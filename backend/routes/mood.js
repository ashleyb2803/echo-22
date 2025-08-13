const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/moodEntry');
const jwt = require('jsonwebtoken');

// Temporary inline middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth header received:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token extracted:', token ? token.substring(0, 50) + '...' : 'No token');

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log('JWT verification result:', err ? err.message : 'Success');
    console.log('User from token:', user);
    
    if (err) return res.sendStatus(403);
    
    req.user = user;
    next();
  });
}



// In your mood.js POST route, add these console.log statements:
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== MOOD POST ROUTE START ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    
    const { mood, note } = req.body;
    const userId = req.user._id;
    
    console.log('Extracted data:', { mood, note, userId });
    
    // Validate mood value
    if (!mood || mood < 1 || mood > 5) {
      console.log('Validation failed: invalid mood');
      return res.status(400).json({ 
        error: 'Mood must be a number between 1 and 5' 
      });
    }

    console.log('Validation passed, checking for existing entry...');
    
    // Check if user already has an entry for today
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date string:', today);
    
    const existingEntry = await MoodEntry.findOne({
      user: userId,
      dateString: today
    });
    
    console.log('Existing entry check result:', existingEntry);

    if (existingEntry) {
      console.log('Entry already exists for today');
      return res.status(409).json({ 
        error: 'Mood entry already exists for today',
        entry: existingEntry
      });
    }

    console.log('Creating new mood entry...');
    
    // Create new mood entry
    const moodEntry = new MoodEntry({
      user: userId,
      mood: parseInt(mood),
      note: note || '',
      date: new Date()
    });
    
    console.log('Mood entry object created:', moodEntry);
    
    console.log('Attempting to save...');
    await moodEntry.save();
    console.log('Save successful!');

    res.status(201).json({
      message: 'Mood entry saved successfully',
      entry: moodEntry
    });

  } catch (error) {
    console.error('=== ERROR IN MOOD POST ROUTE ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to save mood entry' 
    });
  }
});
// GET /api/mood/today - Check if user has mood entry for today
router.get('/today', authenticateToken, async (req, res) => { // Changed from requireAuth
  try {
    const userId = req.user._id;
    const todayEntry = await MoodEntry.hasTodayEntry(userId);
    
    res.json({
      hasEntry: !!todayEntry,
      entry: todayEntry
    });

  } catch (error) {
    console.error('Error checking today mood entry:', error);
    res.status(500).json({ 
      error: 'Failed to check mood entry' 
    });
  }
});

// GET /api/mood/history - Get mood history with optional date range
router.get('/history', authenticateToken, async (req, res) => { // Changed from requireAuth
  try {
    const userId = req.user._id;
    const { startDate, endDate, limit = 30 } = req.query;

    let query = { user: userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await MoodEntry.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calculate mood statistics
    const stats = {
      totalEntries: entries.length,
      averageMood: 0,
      moodDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (entries.length > 0) {
      const sum = entries.reduce((acc, entry) => acc + entry.mood, 0);
      stats.averageMood = (sum / entries.length).toFixed(1);
      
      entries.forEach(entry => {
        stats.moodDistribution[entry.mood]++;
      });
    }

    res.json({
      entries,
      stats
    });

  } catch (error) {
    console.error('Error fetching mood history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mood history' 
    });
  }
});

// GET /api/mood/week - Get current week's mood data for dashboard
router.get('/week', authenticateToken, async (req, res) => { // Changed from requireAuth
  try {
    const userId = req.user._id;
    
    // Get last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const entries = await MoodEntry.getMoodRange(userId, startDate, endDate);
    
    // Create array for last 7 days with mood data
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const entry = entries.find(e => e.dateString === dateString);
      
      weekData.push({
        date: date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        fullDate: dateString,
        mood: entry ? entry.mood : null,
        hasEntry: !!entry
      });
    }

    res.json({ weekData });

  } catch (error) {
    console.error('Error fetching week mood data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch week mood data' 
    });
  }
});

// PUT /api/mood/:id - Update mood entry (same day only)
router.put('/:id', authenticateToken, async (req, res) => { // Changed from requireAuth
  try {
    const { mood, note } = req.body;
    const userId = req.user._id;
    const entryId = req.params.id;

    // Validate mood value
    if (mood && (mood < 1 || mood > 5)) {
      return res.status(400).json({ 
        error: 'Mood must be a number between 1 and 5' 
      });
    }

    const entry = await MoodEntry.findOne({
      _id: entryId,
      user: userId
    });

    if (!entry) {
      return res.status(404).json({ 
        error: 'Mood entry not found' 
      });
    }

    // Only allow editing same day entries
    const today = new Date().toISOString().split('T')[0];
    if (entry.dateString !== today) {
      return res.status(403).json({ 
        error: 'Can only edit today\'s mood entry' 
      });
    }

    // Update entry
    if (mood) entry.mood = parseInt(mood);
    if (note !== undefined) entry.note = note;

    await entry.save();

    res.json({
      message: 'Mood entry updated successfully',
      entry
    });

  } catch (error) {
    console.error('Error updating mood entry:', error);
    res.status(500).json({ 
      error: 'Failed to update mood entry' 
    });
  }
});

module.exports = router;