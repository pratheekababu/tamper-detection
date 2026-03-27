const mongoose = require('mongoose');

// ─── Audit Log Schema ─────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'VIEW_STUDENT', 'EDIT_REQUEST_CREATED',
      'EDIT_REQUEST_APPROVED', 'EDIT_REQUEST_REJECTED', 'DATA_MODIFIED',
      'INTEGRITY_CHECK', 'TAMPER_DETECTED', 'PDF_GENERATED',
      'ANNOUNCEMENT_CREATED', 'USER_CREATED', 'USER_DEACTIVATED',
      'HASH_RECOMPUTED', 'PASSWORD_CHANGED'
    ]
  },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    name: String,
    userIdentifier: String // student/faculty ID
  },
  targetStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'performedBy.userId': 1 });
auditLogSchema.index({ targetStudent: 1 });
auditLogSchema.index({ action: 1 });

// ─── Edit Request Schema ──────────────────────────────────────────────────────
const editRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    default: () => 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  requestedChanges: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  originalData: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNote: {
    type: String,
    trim: true,
    maxlength: 500
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, { timestamps: true });

editRequestSchema.index({ status: 1, createdAt: -1 });
editRequestSchema.index({ faculty: 1 });
editRequestSchema.index({ student: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const EditRequest = mongoose.model('EditRequest', editRequestSchema);

module.exports = { AuditLog, EditRequest };
