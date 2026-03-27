const crypto = require('crypto');
const Student = require('../models/Student');
const { AuditLog } = require('../models/AuditLog');

// ─── Generate SHA-256 Hash for student data ───────────────────────────────────
const generateStudentHash = (studentData) => {
  const canonical = {
    studentId: studentData.studentId,
    cgpa: studentData.cgpa,
    totalCredits: studentData.totalCredits,
    semesterRecords: studentData.semesterRecords,
    program: studentData.program,
    branch: studentData.branch,
    batch: studentData.batch
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex');
};

// ─── Verify Single Student Integrity ─────────────────────────────────────────
const verifyStudentIntegrity = async (student) => {
  const computedHash = generateStudentHash(student);
  const isValid = computedHash === student.dataHash;

  if (!isValid) {
    await Student.findByIdAndUpdate(student._id, {
      integrityStatus: 'tampered'
    });

    await AuditLog.create({
      action: 'TAMPER_DETECTED',
      performedBy: { role: 'system', name: 'System', userIdentifier: 'SYSTEM' },
      targetStudent: student._id,
      details: {
        storedHash: student.dataHash,
        computedHash,
        studentId: student.studentId
      },
      status: 'warning',
      severity: 'critical'
    });
  }

  return {
    isValid,
    storedHash: student.dataHash,
    computedHash,
    studentId: student.studentId,
    integrityStatus: isValid ? 'verified' : 'tampered'
  };
};

// ─── Bulk Integrity Check ─────────────────────────────────────────────────────
const runIntegrityCheck = async (performedBy = null) => {
  const students = await Student.find({});
  const results = {
    total: students.length,
    verified: 0,
    tampered: 0,
    tamperedStudents: []
  };

  for (const student of students) {
    const result = await verifyStudentIntegrity(student);
    if (result.isValid) {
      results.verified++;
    } else {
      results.tampered++;
      results.tamperedStudents.push({
        studentId: student.studentId,
        _id: student._id,
        storedHash: result.storedHash,
        computedHash: result.computedHash
      });
    }
  }

  await AuditLog.create({
    action: 'INTEGRITY_CHECK',
    performedBy: performedBy || { role: 'system', name: 'System', userIdentifier: 'SYSTEM' },
    details: {
      total: results.total,
      verified: results.verified,
      tampered: results.tampered
    },
    status: results.tampered > 0 ? 'warning' : 'success',
    severity: results.tampered > 0 ? 'high' : 'low'
  });

  return results;
};

// ─── Repair Hash (Admin Only) ─────────────────────────────────────────────────
const repairStudentHash = async (studentId, adminUser) => {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');

  const newHash = generateStudentHash(student);
  const previousHash = student.dataHash;

  student.hashHistory.push({
    hash: newHash,
    changedBy: adminUser._id,
    changedAt: new Date(),
    changeType: 'repair',
    previousHash
  });

  student.dataHash = newHash;
  student.integrityStatus = 'verified';
  student.lastVerified = new Date();
  await student.save();

  await AuditLog.create({
    action: 'HASH_RECOMPUTED',
    performedBy: {
      userId: adminUser._id,
      role: adminUser.role,
      name: adminUser.name,
      userIdentifier: adminUser.userId
    },
    targetStudent: student._id,
    details: { previousHash, newHash, studentId: student.studentId },
    status: 'success',
    severity: 'medium'
  });

  return { success: true, newHash, previousHash };
};

// ─── Hash Info Formatter ──────────────────────────────────────────────────────
const formatHashDisplay = (hash) => {
  if (!hash) return 'N/A';
  return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
};

module.exports = {
  generateStudentHash,
  verifyStudentIntegrity,
  runIntegrityCheck,
  repairStudentHash,
  formatHashDisplay
};
