const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { EditRequest, AuditLog } = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/faculty/me - Faculty gets own detailed profile
router.get('/me', authenticate, authorize('faculty'), async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id })
      .populate('userId', 'name email department phone userId profilePhoto isActive lastLogin createdAt');

    if (!faculty) {
      // Return basic user info if no faculty profile exists yet
      return res.json({
        success: true,
        faculty: null,
        user: {
          name: req.user.name,
          email: req.user.email,
          userId: req.user.userId,
          department: req.user.department,
          phone: req.user.phone,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt
        }
      });
    }

    res.json({ success: true, faculty });
  } catch (err) {
    console.error('Faculty profile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/faculty/list - Admin/Faculty gets list of all faculty with details
router.get('/list', authenticate, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, department } = req.query;
    const filter = {};
    if (department) filter.specialization = { $regex: department, $options: 'i' };

    let faculties = await Faculty.find(filter)
      .populate('userId', 'name email department phone userId isActive lastLogin createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Faculty.countDocuments(filter);

    res.json({
      success: true,
      faculties,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Faculty list error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/faculty/edit-request - Faculty submits edit request
router.post('/edit-request', authenticate, authorize('faculty'), async (req, res) => {
  try {
    const { studentId, reason, requestedChanges } = req.body;

    if (!studentId || !reason || !requestedChanges) {
      return res.status(400).json({ success: false, message: 'Student ID, reason, and changes are required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Check for existing pending request for same student by same faculty
    const existingRequest = await EditRequest.findOne({
      faculty: req.user._id,
      student: studentId,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(409).json({ success: false, message: 'You already have a pending request for this student.' });
    }

    // Store original data snapshot
    const originalData = {
      cgpa: student.cgpa,
      currentSemester: student.currentSemester,
      semesterRecords: student.semesterRecords,
      totalCredits: student.totalCredits
    };

    const editRequest = await EditRequest.create({
      faculty: req.user._id,
      student: studentId,
      reason,
      requestedChanges,
      originalData
    });

    await AuditLog.create({
      action: 'EDIT_REQUEST_CREATED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetStudent: studentId,
      details: { requestId: editRequest.requestId, reason },
      status: 'success', severity: 'medium'
    });

    res.status(201).json({ success: true, message: 'Edit request submitted successfully. Awaiting admin approval.', editRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/faculty/edit-requests - Faculty sees own requests
router.get('/edit-requests', authenticate, authorize('faculty'), async (req, res) => {
  try {
    const requests = await EditRequest.find({ faculty: req.user._id })
      .populate('student', 'studentId cgpa program branch')
      .populate('reviewedBy', 'name userId')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/faculty/dashboard-stats
router.get('/dashboard-stats', authenticate, authorize('faculty'), async (req, res) => {
  try {
    const [totalStudents, pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
      Student.countDocuments({}),
      EditRequest.countDocuments({ faculty: req.user._id, status: 'pending' }),
      EditRequest.countDocuments({ faculty: req.user._id, status: 'approved' }),
      EditRequest.countDocuments({ faculty: req.user._id, status: 'rejected' })
    ]);

    const recentActivity = await AuditLog.find({ 'performedBy.userId': req.user._id })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: { totalStudents, pendingRequests, approvedRequests, rejectedRequests },
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
