// backend/routes/users.js
const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.json({ message: 'User route working!' });
});

module.exports = router;
