const jwt = require('jsonwebtoken');

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

// Add this line - create an alias
const requireAuth = authenticateToken;

// Update your exports to include both names
module.exports = { authenticateToken, requireAuth };