const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const { AuditLog } = require('../models/AuditLog');
const { authenticate, generateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'User ID and password are required.' });
    }

    // Find user by userId or email
    const user = await User.findOne({
      $or: [{ userId: userId.trim() }, { email: userId.toLowerCase().trim() }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({
        action: 'LOGIN',
        performedBy: { userIdentifier: userId, role: 'unknown', name: 'Unknown' },
        details: { userId, reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        severity: 'medium'
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Get student profile if role is student
    let studentData = null;
    if (user.role === 'student') {
      studentData = await Student.findOne({ userId: user._id })
        .select('studentId cgpa currentSemester program branch batch integrityStatus');
    }

    await AuditLog.create({
      action: 'LOGIN',
      performedBy: {
        userId: user._id,
        role: user.role,
        name: user.name,
        userIdentifier: user.userId
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin
      },
      studentData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let studentData = null;

    if (user.role === 'student') {
      studentData = await Student.findOne({ userId: user._id });
    }

    res.json({ success: true, user, studentData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await AuditLog.create({
      action: 'LOGOUT',
      performedBy: {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name,
        userIdentifier: req.user.userId
      },
      ipAddress: req.ip,
      status: 'success',
      severity: 'low'
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_CHANGED',
      performedBy: { userId: user._id, role: user.role, name: user.name, userIdentifier: user.userId },
      status: 'success', severity: 'medium'
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
