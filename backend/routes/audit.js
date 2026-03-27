const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/audit/logs - Admin sees all logs
router.get('/logs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, severity, startDate, endDate, userId } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (severity) filter.severity = severity;
    if (userId) filter['performedBy.userId'] = userId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/audit/summary - Stats summary
router.get('/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [bySeverity, byAction, recent24h] = await Promise.all([
      AuditLog.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AuditLog.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    res.json({ success: true, bySeverity, byAction, recent24h });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
