const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate requests via HTTP-Only cookie `token`
 */
async function authenticate(req, res, next) {
  try {
    let token = req.cookies.token;

    // Fallback to Bearer token if header provided
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No session cookie found.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User record no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your institutional account has been deactivated.' });
    }

    if (!user.email.endsWith('@klu.ac.in')) {
      return res.status(403).json({ success: false, message: 'Access denied. Only @klu.ac.in institutional accounts are permitted.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Middleware to enforce role-based permissions
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
