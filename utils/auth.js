const jwt = require('jsonwebtoken');
const User = require('../backend/models/User');

const authenticate = async (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = { authenticate };