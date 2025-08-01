const express = require('express');
const router = express.Router();
const moodEntriesCtrl = require('../controllers/moodEntries');
const ensureLoggedIn = require('../middleware/ensureLoggedIn');

// All routes are protected
router.post('/', ensureLoggedIn, moodEntriesCtrl.create);
router.get('/', ensureLoggedIn, moodEntriesCtrl.index);

module.exports = router;
