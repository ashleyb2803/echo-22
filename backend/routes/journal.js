const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/journalEntry');
const { requireAuth } = require('../middleware/auth');

// Encryption key - In production, use a proper key management system
const ENCRYPTION_KEY = process.env.JOURNAL_ENCRYPTION_KEY || 'your-secret-key-here';

// POST /api/journal - Create new journal entry
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, tags, mood, isPrivate = true } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Journal content cannot be empty' 
      });
    }

    // Create new journal entry
    const journalEntry = new JournalEntry({
      user: userId,
      title: title || '',
      tags: tags || [],
      mood: mood ? parseInt(mood) : undefined,
      isPrivate
    });

    // Encrypt content
    journalEntry.encryptContent(content, ENCRYPTION_KEY);
    await journalEntry.save();

    // Return entry without encrypted content
    const safeEntry = {
      _id: journalEntry._id,
      title: journalEntry.title,
      tags: journalEntry.tags,
      mood: journalEntry.mood,
      isPrivate: journalEntry.isPrivate,
      createdAt: journalEntry.createdAt,
      updatedAt: journalEntry.updatedAt
    };

    res.status(201).json({
      message: 'Journal entry created successfully',
      entry: safeEntry
    });

  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ 
      error: 'Failed to create journal entry' 
    });
  }
});

// GET /api/journal - Get user's journal entries
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 20, 
      tags, 
      startDate, 
      endDate,
      includeContent = false 
    } = req.query;

    let query = { user: userId };

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Decrypt content if requested
    const processedEntries = entries.map(entry => {
      const safeEntry = {
        _id: entry._id,
        title: entry.title,
        tags: entry.tags,
        mood: entry.mood,
        isPrivate: entry.isPrivate,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        hasContent: !!entry.encryptedContent
      };

      if (includeContent === 'true') {
        try {
          safeEntry.content = entry.decryptContent(ENCRYPTION_KEY);
        } catch (error) {
          console.error('Error decrypting content:', error);
          safeEntry.contentError = 'Unable to decrypt content';
        }
      }

      return safeEntry;
    });

    // Get total count for pagination
    const total = await JournalEntry.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      entries: processedEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal entries' 
    });
  }
});

// GET /api/journal/:id - Get specific journal entry with content
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;

    const entry = await JournalEntry.findOne({
      _id: entryId,
      user: userId
    });

    if (!entry) {
      return res.status(404).json({ 
        error: 'Journal entry not found' 
      });
    }

    // Decrypt content
    try {
      const decryptedContent = entry.decryptContent(ENCRYPTION_KEY);
      
      res.json({
        entry: {
          _id: entry._id,
          title: entry.title,
          content: decryptedContent,
          tags: entry.tags,
          mood: entry.mood,
          isPrivate: entry.isPrivate,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        }
      });
    } catch (error) {
      console.error('Error decrypting journal entry:', error);
      res.status(500).json({ 
        error: 'Unable to decrypt journal entry' 
      });
    }

  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal entry' 
    });
  }
});

// PUT /api/journal/:id - Update journal entry
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, tags, mood, isPrivate } = req.body;
    const userId = req.user._id;
    const entryId = req.params.id;

    const entry = await JournalEntry.findOne({
      _id: entryId,
      user: userId
    });

    if (!entry) {
      return res.status(404).json({ 
        error: 'Journal entry not found' 
      });
    }

    // Update fields
    if (title !== undefined) entry.title = title;
    if (tags !== undefined) entry.tags = tags;
    if (mood !== undefined) entry.mood = mood ? parseInt(mood) : undefined;
    if (isPrivate !== undefined) entry.isPrivate = isPrivate;

    // Update content if provided
    if (content !== undefined) {
      if (content.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Journal content cannot be empty' 
        });
      }
      entry.encryptContent(content, ENCRYPTION_KEY);
    }

    await entry.save();

    // Return safe entry
    const safeEntry = {
      _id: entry._id,
      title: entry.title,
      tags: entry.tags,
      mood: entry.mood,
      isPrivate: entry.isPrivate,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };

    res.json({
      message: 'Journal entry updated successfully',
      entry: safeEntry
    });

  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ 
      error: 'Failed to update journal entry' 
    });
  }
});

// DELETE /api/journal/:id - Delete journal entry
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;

    const entry = await JournalEntry.findOneAndDelete({
      _id: entryId,
      user: userId
    });

    if (!entry) {
      return res.status(404).json({ 
        error: 'Journal entry not found' 
      });
    }

    res.json({ 
      message: 'Journal entry deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ 
      error: 'Failed to delete journal entry' 
    });
  }
});

// GET /api/journal/stats - Get journal statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          averageMood: { $avg: '$mood' },
          moodDistribution: {
            $push: '$mood'
          },
          tagFrequency: {
            $push: '$tags'
          }
        }
      }
    ]);

    // Process tag frequency
    let tagStats = {};
    if (stats[0]?.tagFrequency) {
      const allTags = stats[0].tagFrequency.flat();
      allTags.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    }

    // Process mood distribution
    let moodStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats[0]?.moodDistribution) {
      stats[0].moodDistribution.forEach(mood => {
        if (mood >= 1 && mood <= 5) {
          moodStats[mood]++;
        }
      });
    }

    res.json({
      period: parseInt(period),
      totalEntries: stats[0]?.totalEntries || 0,
      averageMood: stats[0]?.averageMood ? 
        Math.round(stats[0].averageMood * 10) / 10 : null,
      moodDistribution: moodStats,
      topTags: Object.entries(tagStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }))
    });

  } catch (error) {
    console.error('Error fetching journal stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal statistics' 
    });
  }
});

module.exports = router;