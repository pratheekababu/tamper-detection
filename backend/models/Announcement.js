const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['academic', 'exam', 'event', 'result', 'holiday', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetRoles: [{
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  }],
  targetDepartments: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetRoles: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
