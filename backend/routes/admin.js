const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { EditRequest, AuditLog } = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const { generateStudentHash, runIntegrityCheck, repairStudentHash } = require('../utils/tamperDetection');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [totalStudents, totalFaculty, pendingRequests, tamperedRecords, totalLogs] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'faculty', isActive: true }),
      EditRequest.countDocuments({ status: 'pending' }),
      Student.countDocuments({ integrityStatus: 'tampered' }),
      AuditLog.countDocuments({})
    ]);

    const recentLogs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('performedBy.userId', 'name');

    const criticalAlerts = await AuditLog.find({ severity: { $in: ['high', 'critical'] } })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: { totalStudents, totalFaculty, pendingRequests, tamperedRecords, totalLogs },
      recentLogs,
      criticalAlerts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/edit-requests - All pending edit requests
router.get('/edit-requests', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = status !== 'all' ? { status } : {};

    const requests = await EditRequest.find(filter)
      .populate('faculty', 'name userId email department')
      .populate({ path: 'student', populate: { path: 'userId', select: 'name email' } })
      .populate('reviewedBy', 'name userId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await EditRequest.countDocuments(filter);

    res.json({ success: true, requests, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/admin/edit-requests/:id/approve
router.post('/edit-requests/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const request = await EditRequest.findById(req.params.id)
      .populate('student')
      .populate('faculty', 'name userId');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed.' });
    }

    // Find student — try by populated _id first, then by studentId string
    let student = await Student.findById(request.student._id || request.student);
    if (!student) {
      // Try finding by studentId string (userId field on User model)
      const User = require('../models/User');
      const userRef = await User.findOne({ userId: request.student?.studentId });
      if (userRef) student = await Student.findOne({ userId: userRef._id });
    }
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found. The student may not have an academic record yet.' });

    // Apply the requested changes
    const changes = request.requestedChanges;
    if (changes.semesterRecord) {
      const existingIdx = student.semesterRecords.findIndex(s => s.semester === changes.semesterRecord.semester);
      if (existingIdx >= 0) {
        student.semesterRecords[existingIdx] = changes.semesterRecord;
      } else {
        student.semesterRecords.push(changes.semesterRecord);
      }
      student.semesterRecords.sort((a, b) => a.semester - b.semester);
      student.computeCGPA();
      student.currentSemester = Math.max(...student.semesterRecords.map(s => s.semester));
    }

    if (changes.cgpa !== undefined) student.cgpa = changes.cgpa;
    if (changes.currentSemester !== undefined) student.currentSemester = changes.currentSemester;

    // Recompute hash after approved changes
    await student.recomputeHash(req.user._id, 'approved_edit');
    await student.save();

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || '';
    await request.save();

    await AuditLog.create({
      action: 'EDIT_REQUEST_APPROVED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetStudent: student._id,
      details: { requestId: request.requestId, appliedChanges: changes, reviewNote },
      status: 'success', severity: 'high'
    });

    res.json({ success: true, message: 'Edit request approved and changes applied.', request });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/admin/edit-requests/:id/reject
router.post('/edit-requests/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const request = await EditRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed.' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || '';
    await request.save();

    await AuditLog.create({
      action: 'EDIT_REQUEST_REJECTED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetStudent: request.student,
      details: { requestId: request.requestId, reviewNote },
      status: 'success', severity: 'medium'
    });

    res.json({ success: true, message: 'Edit request rejected.', request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/admin/integrity-check - Run full integrity check
router.post('/integrity-check', authenticate, authorize('admin'), async (req, res) => {
  try {
    const results = await runIntegrityCheck({
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
      userIdentifier: req.user.userId
    });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/admin/repair-hash/:studentId
router.post('/repair-hash/:studentId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await repairStudentHash(req.params.studentId, req.user);
    res.json({ success: true, message: 'Hash repaired successfully.', result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users - Create new user (student or faculty)
router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, name, email, password, role, department, phone, studentData } = req.body;

    if (!userId || !name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User ID or email already exists.' });
    }

    const newUser = await User.create({ userId, name, email, password, role, department, phone });

    if (role === 'student' && studentData) {
      const { program, branch, batch, semesterRecords = [] } = studentData;
      const newStudent = new Student({
        userId: newUser._id,
        studentId: userId,
        program,
        branch,
        batch: parseInt(batch),
        semesterRecords,
        dataHash: 'pending'
      });

      if (semesterRecords.length > 0) newStudent.computeCGPA();

      const hash = generateStudentHash(newStudent);
      newStudent.dataHash = hash;
      newStudent.hashHistory.push({ hash, changedBy: req.user._id, changeType: 'initial', previousHash: null });
      await newStudent.save();
    }

    if (role === 'faculty') {
      const facultyData = req.body.facultyData || {};
      await Faculty.create({
        userId: newUser._id,
        facultyId: userId,
        designation: facultyData.designation || 'Assistant Professor',
        specialization: facultyData.specialization || department || 'General',
        qualifications: facultyData.qualifications || [],
        experience: facultyData.experience || 0,
        joiningDate: facultyData.joiningDate || new Date(),
        coursesTaught: facultyData.coursesTaught || [],
        researchInterests: facultyData.researchInterests || [],
        publications: facultyData.publications || 0,
        officeRoom: facultyData.officeRoom || '',
        officeHours: facultyData.officeHours || '',
        bio: facultyData.bio || ''
      });
    }

    await AuditLog.create({
      action: 'USER_CREATED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetUser: newUser._id,
      details: { newUserId: userId, role },
      status: 'success', severity: 'medium'
    });

    res.status(201).json({ success: true, message: 'User created successfully.', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/admin/users/:id/toggle-status
router.patch('/users/:id/toggle-status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({
      action: user.isActive ? 'USER_CREATED' : 'USER_DEACTIVATED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetUser: user._id,
      details: { isActive: user.isActive },
      status: 'success', severity: 'high'
    });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
