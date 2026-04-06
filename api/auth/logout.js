const { connectToDatabase } = require('../../utils/db');
const { authenticate } = require('../../utils/auth');
const { AuditLog } = require('../../backend/models/AuditLog');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    await authenticate(req);

    await AuditLog.create({
      action: 'LOGOUT',
      performedBy: {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name,
        userIdentifier: req.user.userId
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      status: 'success',
      severity: 'low'
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};