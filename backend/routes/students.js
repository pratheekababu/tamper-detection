const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { verifyStudentIntegrity } = require('../utils/tamperDetection');
const { AuditLog } = require('../models/AuditLog');

// GET /api/students/me - Student gets own profile
router.get('/me', authenticate, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('userId', 'name email department phone userId')
      .populate('advisor', 'name email userId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const integrityResult = await verifyStudentIntegrity(student);

    await AuditLog.create({
      action: 'VIEW_STUDENT',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetStudent: student._id,
      details: { viewedBy: 'self' },
      status: 'success', severity: 'low'
    });

    res.json({ success: true, student, integrityResult });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/students - Faculty/Admin gets list of students
router.get('/', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, branch, program } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (program) filter.program = program;

    let query = Student.find(filter)
      .populate('userId', 'name email department phone userId isActive')
      .populate('advisor', 'name userId')
      .select('-hashHistory')
      .sort({ createdAt: -1 });

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ],
        role: 'student'
      }).select('_id');
      const userIds = users.map(u => u._id);
      query = Student.find({
        ...filter,
        $or: [
          { studentId: { $regex: search, $options: 'i' } },
          { userId: { $in: userIds } }
        ]
      }).populate('userId', 'name email department phone userId isActive')
        .populate('advisor', 'name userId')
        .select('-hashHistory')
        .sort({ createdAt: -1 });
    }

    const total = await Student.countDocuments(filter);
    const students = await query
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      students,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/students/:id - Get specific student
router.get('/:id', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'name email department phone userId')
      .populate('advisor', 'name email userId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const integrityResult = await verifyStudentIntegrity(student);

    await AuditLog.create({
      action: 'VIEW_STUDENT',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetStudent: student._id,
      details: { studentId: student.studentId },
      status: 'success', severity: 'low'
    });

    res.json({ success: true, student, integrityResult });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/students/:id/integrity - Verify integrity
router.get('/:id/integrity', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const integrityResult = await verifyStudentIntegrity(student);

    res.json({ success: true, integrityResult, hashHistory: student.hashHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
