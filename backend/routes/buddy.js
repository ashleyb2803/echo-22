const express = require('express');
const router = express.Router();
const { Buddy, FlareSignal, CheckInShare } = require('../models/buddy');
const User = require('../models/user'); // Assuming you have a User model
const { requireAuth } = require('../middleware/auth');

// POST /api/buddy/invite - Create buddy invite code
router.post('/invite', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Create a buddy relationship with invite code
    const buddy = new Buddy({
      requester: userId,
      recipient: userId, // Will be updated when someone uses the code
      status: 'pending'
    });
    
    const inviteCode = buddy.generateInviteCode();
    await buddy.save();

    res.json({
      message: 'Invite code generated successfully',
      inviteCode,
      expiresIn: '7 days' // You can implement expiration logic
    });

  } catch (error) {
    console.error('Error generating invite code:', error);
    res.status(500).json({ 
      error: 'Failed to generate invite code' 
    });
  }
});

// POST /api/buddy/join - Join using invite code
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({ 
        error: 'Invite code is required' 
      });
    }

    // Find the invite
    const invite = await Buddy.findOne({ 
      inviteCode,
      status: 'pending'
    }).populate('requester', 'name email');

    if (!invite) {
      return res.status(404).json({ 
        error: 'Invalid or expired invite code' 
      });
    }

    // Can't buddy yourself
    if (invite.requester._id.equals(userId)) {
      return res.status(400).json({ 
        error: 'Cannot add yourself as a buddy' 
      });
    }

    // Check if buddy relationship already exists
    const existingBuddy = await Buddy.findOne({
      $or: [
        { requester: userId, recipient: invite.requester._id },
        { requester: invite.requester._id, recipient: userId }
      ]
    });

    if (existingBuddy && existingBuddy._id.toString() !== invite._id.toString()) {
      return res.status(409).json({ 
        error: 'Buddy relationship already exists' 
      });
    }

    // Update the invite with recipient and accept it
    invite.recipient = userId;
    invite.status = 'accepted';
    invite.inviteCode = undefined; // Remove invite code once used
    await invite.save();

    // Create reciprocal relationship
    const reciprocalBuddy = new Buddy({
      requester: userId,
      recipient: invite.requester._id,
      status: 'accepted'
    });
    await reciprocalBuddy.save();

    await invite.populate('recipient', 'name email');

    res.json({
      message: 'Successfully joined as buddies!',
      buddy: {
        id: invite._id,
        buddy: invite.requester,
        status: 'accepted',
        permissions: invite.permissions
      }
    });

  } catch (error) {
    console.error('Error joining buddy:', error);
    res.status(500).json({ 
      error: 'Failed to join buddy' 
    });
  }
});

// GET /api/buddy/list - Get user's buddies
router.get('/list', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const buddies = await Buddy.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ],
      status: 'accepted'
    })
    .populate('requester', 'name email createdAt')
    .populate('recipient', 'name email createdAt');

    // Format buddy list
    const buddyList = buddies.map(buddy => {
      const isRequester = buddy.requester._id.equals(userId);
      const buddyUser = isRequester ? buddy.recipient : buddy.requester;
      
      return {
        id: buddy._id,
        buddy: buddyUser,
        status: buddy.status,
        permissions: buddy.permissions,
        since: buddy.createdAt
      };
    });

    res.json({ buddies: buddyList });

  } catch (error) {
    console.error('Error fetching buddies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch buddies' 
    });
  }
});

// POST /api/buddy/flare - Send flare signal to buddy
router.post('/flare', requireAuth, async (req, res) => {
  try {
    const { buddyId, message, urgencyLevel = 'medium' } = req.body;
    const userId = req.user._id;

    // Verify buddy relationship exists and allows flare signals
    const buddyRelation = await Buddy.findOne({
      $or: [
        { requester: userId, recipient: buddyId },
        { requester: buddyId, recipient: userId }
      ],
      status: 'accepted',
      'permissions.allowFlareSignals': true
    });

    if (!buddyRelation) {
      return res.status(404).json({ 
        error: 'Buddy not found or flare signals not allowed' 
      });
    }

    // Create flare signal
    const flareSignal = new FlareSignal({
      sender: userId,
      recipient: buddyId,
      message: message || 'Your buddy needs support right now.',
      urgencyLevel
    });

    await flareSignal.save();

    // TODO: Send real-time notification (WebSocket/Push notification)
    // TODO: Send email/SMS if high urgency

    res.json({
      message: 'Flare signal sent successfully',
      flareId: flareSignal._id
    });

  } catch (error) {
    console.error('Error sending flare signal:', error);
    res.status(500).json({ 
      error: 'Failed to send flare signal' 
    });
  }
});

// GET /api/buddy/flares - Get received flare signals
router.get('/flares', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { unreadOnly = false } = req.query;

    let query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const flares = await FlareSignal.find(query)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ flares });

  } catch (error) {
    console.error('Error fetching flares:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flare signals' 
    });
  }
});

// PUT /api/buddy/flares/:id/respond - Respond to flare signal
router.put('/flares/:id/respond', requireAuth, async (req, res) => {
  try {
    const { response } = req.body;
    const flareId = req.params.id;
    const userId = req.user._id;

    const flare = await FlareSignal.findOne({
      _id: flareId,
      recipient: userId
    });

    if (!flare) {
      return res.status(404).json({ 
        error: 'Flare signal not found' 
      });
    }

    flare.isRead = true;
    flare.respondedAt = new Date();
    if (response) {
      flare.response = response;
    }

    await flare.save();

    res.json({
      message: 'Response recorded successfully',
      flare
    });

  } catch (error) {
    console.error('Error responding to flare:', error);
    res.status(500).json({ 
      error: 'Failed to respond to flare signal' 
    });
  }
});

// PUT /api/buddy/:id/permissions - Update buddy permissions
router.put('/:id/permissions', requireAuth, async (req, res) => {
  try {
    const { permissions } = req.body;
    const buddyId = req.params.id;
    const userId = req.user._id;

    const buddy = await Buddy.findOne({
      _id: buddyId,
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    });

    if (!buddy) {
      return res.status(404).json({ 
        error: 'Buddy relationship not found' 
      });
    }

    // Update permissions
    buddy.permissions = { ...buddy.permissions, ...permissions };
    await buddy.save();

    res.json({
      message: 'Permissions updated successfully',
      permissions: buddy.permissions
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ 
      error: 'Failed to update permissions' 
    });
  }
});

// DELETE /api/buddy/:id - Remove buddy relationship
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const buddyId = req.params.id;
    const userId = req.user._id;

    // Find and remove both directions of the relationship
    await Buddy.deleteMany({
      $or: [
        { requester: userId, recipient: buddyId },
        { requester: buddyId, recipient: userId }
      ]
    });

    res.json({ message: 'Buddy relationship removed successfully' });

  } catch (error) {
    console.error('Error removing buddy:', error);
    res.status(500).json({ 
      error: 'Failed to remove buddy relationship' 
    });
  }
});

module.exports = router;