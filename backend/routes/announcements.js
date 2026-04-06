const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { AuditLog } = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// ─── Announcements ────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {
      isActive: true,
      targetRoles: req.user.role,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    };
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name userId role')
      .sort({ priority: -1, createdAt: -1 })
      .limit(20);

    // Increment view count
    await Announcement.updateMany({ _id: { $in: announcements.map(a => a._id) } }, { $inc: { viewCount: 1 } });

    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, content, category, priority, targetRoles, expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content required.' });

    const announcement = await Announcement.create({
      title, content, category, priority,
      targetRoles: targetRoles || ['student', 'faculty'],
      expiresAt: expiresAt || null,
      createdBy: req.user._id
    });

    await AuditLog.create({
      action: 'ANNOUNCEMENT_CREATED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      details: { title, category },
      status: 'success', severity: 'low'
    });

    res.status(201).json({ success: true, message: 'Announcement created.', announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Announcement removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
