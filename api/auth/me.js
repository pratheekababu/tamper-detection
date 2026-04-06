const { connectToDatabase } = require('../../utils/db');
const { authenticate } = require('../../utils/auth');
const User = require('../../backend/models/User');
const Student = require('../../backend/models/Student');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    await authenticate(req);

    const user = await User.findById(req.user._id);
    let studentData = null;

    if (user.role === 'student') {
      studentData = await Student.findOne({ userId: user._id });
    }

    res.json({ success: true, user, studentData });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};