// Load environment variables first
require('dotenv').config();
// Then connect to database
require('./db');

const express = require('express');
const path = require('path');
//const favicon = require('serve-favicon');
const logger = require('morgan');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
//app.use(favicon(path.join(__dirname, 'build', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'build')));







// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/buddy', require('./routes/buddy'));
app.use('/api/journal', require('./routes/journal')); // We'll create this next
app.use('/api/resources', require('./routes/resources')); // We'll create this next
app.use('/api/auth', require('./routes/auth')); // Authentication routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Catch all handler for React Router
//app.get('/*', function(req, res) {
  //res.sendFile(path.join(__dirname, 'build', 'index.html'));
//});

const port = process.env.PORT || 3001;

app.listen(port, function() {
  console.log(`Echo 22 server running on port ${port}`);
  console.log(`Mental health support platform ready 🎖️`);
});