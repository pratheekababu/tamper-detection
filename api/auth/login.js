const { connectToDatabase } = require('../../utils/db');
const User = require('../../backend/models/User');
const Student = require('../../backend/models/Student');
const { AuditLog } = require('../../backend/models/AuditLog');
const { generateToken } = require('../../backend/middleware/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

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
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
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
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
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
};