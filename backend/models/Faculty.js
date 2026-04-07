const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  facultyId: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD', 'Dean', 'Visiting Faculty'],
    default: 'Assistant Professor'
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  qualifications: [{
    degree: { type: String, required: true },
    field: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number }
  }],
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  coursesTaught: [{
    name: { type: String, required: true },
    code: { type: String },
    semester: { type: Number },
    program: { type: String }
  }],
  researchInterests: [{
    type: String,
    trim: true
  }],
  publications: {
    type: Number,
    default: 0,
    min: 0
  },
  officeRoom: {
    type: String,
    trim: true
  },
  officeHours: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
