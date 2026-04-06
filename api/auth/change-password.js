const { connectToDatabase } = require('../../utils/db');
const { authenticate } = require('../../utils/auth');
const User = require('../../backend/models/User');
const { AuditLog } = require('../../backend/models/AuditLog');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    await authenticate(req);

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
      performedBy: { userId: user._id, role: user.role, name: user.userId, userIdentifier: user.userId },
      status: 'success', severity: 'medium'
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};