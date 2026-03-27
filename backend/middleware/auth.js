const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuditLog } = require('../models/AuditLog');

// ─── Verify JWT Token ─────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+isActive');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token invalid. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    next(err);
  }
};

// ─── Role Authorization ───────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// ─── Audit Logger Middleware ──────────────────────────────────────────────────
const auditLog = (action, severity = 'low') => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (data.success !== false) {
        try {
          await AuditLog.create({
            action,
            performedBy: {
              userId: req.user?._id,
              role: req.user?.role,
              name: req.user?.name,
              userIdentifier: req.user?.userId
            },
            targetStudent: req.params?.studentId || req.body?.studentId || null,
            details: {
              method: req.method,
              path: req.path,
              query: req.query,
              bodyKeys: Object.keys(req.body || {})
            },
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: 'success',
            severity
          });
        } catch (logErr) {
          console.error('Audit log error:', logErr.message);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

// ─── Generate JWT Token ───────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

module.exports = { authenticate, authorize, auditLog, generateToken };
