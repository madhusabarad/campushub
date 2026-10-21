const jwt = require('jsonwebtoken');

/**
 * Verify a JWT Bearer token and attach the decoded payload to req.user.
 * Exported both as the default export and as { protect }, so
 * `const protect = require(...)` and `const { protect } = require(...)` both work.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp, ... }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized. Token is invalid or expired.' });
  }
};

module.exports = protect;
module.exports.protect = protect;
