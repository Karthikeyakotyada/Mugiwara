const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * POST /api/v1/auth/google
 * Cryptographic Google ID Token verification
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required.' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Cryptographic Google ID token verification failed: ' + e.message });
    }

    const { sub: googleId, email, name, email_verified, hd } = payload;

    if (!email_verified) {
      return res.status(403).json({ success: false, message: 'Unverified Google email accounts are denied access.' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no associated email.' });
    }

    if (!email.endsWith('@klu.ac.in') && process.env.ALLOW_DEV_AUTH !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied. Only @klu.ac.in institutional email accounts are permitted.'
      });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      // Auto-provision student by default if not pre-seeded
      user = await User.create({
        googleId,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'STUDENT',
        department: '',
        isActive: true
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your institutional account has been deactivated by Admin.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    await AuditLog.create({
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user._id.toString(),
      metadata: { method: 'GOOGLE_OAUTH', email: user.email }
    });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        registerNumber: user.registerNumber
      }
    });
  } catch (err) {
    console.error('[AuthRoutes] Google Login Error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error during Google login.' });
  }
});

/**
 * POST /api/v1/auth/dev-switch (Controlled Dev Feature for 1-Click Institutional Account Testing)
 */
router.post('/dev-switch', async (req, res) => {
  if (process.env.ALLOW_DEV_AUTH !== 'true') {
    return res.status(403).json({ success: false, message: 'Development authentication is disabled in production.' });
  }

  try {
    const { role, email } = req.body;

    let targetEmail = email;
    if (!targetEmail) {
      switch (role) {
        case 'SUPERVISOR':
          targetEmail = 'supervisor1@klu.ac.in';
          break;
        case 'COORDINATOR':
          targetEmail = 'coordinator1@klu.ac.in';
          break;
        case 'ADMIN':
          targetEmail = 'admin@klu.ac.in';
          break;
        case 'STUDENT':
        default:
          targetEmail = 'student1@klu.ac.in';
          break;
      }
    }

    const user = await User.findOne({ email: targetEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: `Test user '${targetEmail}' not found in database.` });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    await AuditLog.create({
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'DEV_LOGIN_SWITCH',
      entityType: 'USER',
      entityId: user._id.toString(),
      metadata: { role: user.role, email: user.email }
    });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        registerNumber: user.registerNumber
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/auth/me
 * Restores user session after page refresh
 */
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      registerNumber: req.user.registerNumber
    }
  });
});

/**
 * PUT /api/v1/auth/profile
 * Updates user department and register number
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { department, registerNumber } = req.body;
    if (department !== undefined) req.user.department = department.toUpperCase().trim();
    if (registerNumber !== undefined) req.user.registerNumber = registerNumber.toUpperCase().trim();
    await req.user.save();

    return res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        registerNumber: req.user.registerNumber
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/auth/logout
 * Clears HTTP-Only cookie session
 */
router.post('/logout', authenticate, async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  await AuditLog.create({
    actorId: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'USER_LOGOUT',
    entityType: 'USER',
    entityId: req.user._id.toString()
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
