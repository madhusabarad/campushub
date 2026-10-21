const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes by verifying a JWT Bearer token.
 * On success, attaches the decoded payload to `req.user`.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded payload (id, name, email, role, etc.)
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized. Token is invalid or expired.' });
  }
};

module.exports = { protect };
