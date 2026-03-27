const mongoose = require('mongoose');
const crypto = require('crypto');

const semesterSchema = new mongoose.Schema({
  semester: { type: Number, required: true, min: 1, max: 10 },
  gpa: { type: Number, required: true, min: 0, max: 10 },
  totalCredits: { type: Number, required: true },
  earnedCredits: { type: Number, required: true },
  year: { type: Number, required: true },
  subjects: [{
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    grade: { type: String, required: true },
    gradePoint: { type: Number, required: true }
  }]
}, { _id: false });

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  program: {
    type: String,
    required: true,
    enum: ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'MBA', 'PhD']
  },
  branch: {
    type: String,
    required: true
  },
  batch: {
    type: Number,
    required: true
  },
  currentSemester: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  cgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  semesterRecords: [semesterSchema],
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // SHA-256 Tamper Detection Fields
  dataHash: {
    type: String,
    required: true
  },
  hashHistory: [{
    hash: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    changeType: String,
    previousHash: String
  }],
  lastVerified: {
    type: Date,
    default: Date.now
  },
  integrityStatus: {
    type: String,
    enum: ['verified', 'tampered', 'pending'],
    default: 'verified'
  }
}, { timestamps: true });

// ─── Hash Generation ──────────────────────────────────────────────────────────
studentSchema.methods.generateHash = function() {
  const sensitiveData = {
    studentId: this.studentId,
    cgpa: this.cgpa,
    totalCredits: this.totalCredits,
    semesterRecords: this.semesterRecords,
    program: this.program,
    branch: this.branch,
    batch: this.batch
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(sensitiveData))
    .digest('hex');
};

// Verify data integrity
studentSchema.methods.verifyIntegrity = function() {
  const currentHash = this.generateHash();
  return currentHash === this.dataHash;
};

// Recompute and save hash
studentSchema.methods.recomputeHash = async function(changedBy, changeType = 'update') {
  const previousHash = this.dataHash;
  const newHash = this.generateHash();

  this.hashHistory.push({
    hash: newHash,
    changedBy,
    changedAt: new Date(),
    changeType,
    previousHash
  });

  this.dataHash = newHash;
  this.lastVerified = new Date();
  this.integrityStatus = 'verified';
  return newHash;
};

// Auto-compute CGPA from semester records
studentSchema.methods.computeCGPA = function() {
  if (!this.semesterRecords || this.semesterRecords.length === 0) {
    this.cgpa = 0;
    return;
  }
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  this.semesterRecords.forEach(sem => {
    totalWeightedPoints += sem.gpa * sem.earnedCredits;
    totalCredits += sem.earnedCredits;
  });
  this.cgpa = totalCredits > 0 ? Math.round((totalWeightedPoints / totalCredits) * 100) / 100 : 0;
  this.totalCredits = totalCredits;
};

// Pre-save middleware
studentSchema.pre('save', function(next) {
  if (this.isModified('semesterRecords')) {
    this.computeCGPA();
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
