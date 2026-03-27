const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Announcement = require('../models/Announcement');
const { AuditLog } = require('../models/AuditLog');

const generateHash = (studentData) => {
  const canonical = {
    studentId: studentData.studentId,
    cgpa: studentData.cgpa,
    totalCredits: studentData.totalCredits,
    semesterRecords: studentData.semesterRecords,
    program: studentData.program,
    branch: studentData.branch,
    batch: studentData.batch
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Announcement.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  console.log('Cleared existing data...');

  // ── Create Admin ──
  const admin = await User.create({
    userId: 'ADMIN001',
    name: 'Dr. Rajesh Kumar',
    email: 'admin@atds.edu',
    password: 'admin123',
    role: 'admin',
    department: 'Administration'
  });

  // ── Create Faculty ──
  const faculty1 = await User.create({
    userId: 'FAC001',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@atds.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Computer Science'
  });

  const faculty2 = await User.create({
    userId: 'FAC002',
    name: 'Prof. Arun Mehta',
    email: 'arun.mehta@atds.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Electronics'
  });

  // ── Create Students ──
  const studentUsers = [
    { userId: 'STU2021001', name: 'Arjun Patel', email: 'arjun.patel@student.atds.edu', department: 'Computer Science' },
    { userId: 'STU2021002', name: 'Meera Krishnan', email: 'meera.k@student.atds.edu', department: 'Computer Science' },
    { userId: 'STU2021003', name: 'Rohit Verma', email: 'rohit.v@student.atds.edu', department: 'Electronics' },
    { userId: 'STU2022001', name: 'Ananya Singh', email: 'ananya.s@student.atds.edu', department: 'Computer Science' },
    { userId: 'STU2022002', name: 'Kiran Reddy', email: 'kiran.r@student.atds.edu', department: 'Mechanical' }
  ];

  const createdStudentUsers = await Promise.all(studentUsers.map(u =>
    User.create({ ...u, password: 'student123', role: 'student' })
  ));

  // Sample semester data
  const semesterSets = [
    [
      { semester: 1, gpa: 8.5, totalCredits: 24, earnedCredits: 24, year: 2021, subjects: [
        { name: 'Engineering Mathematics I', credits: 4, grade: 'A', gradePoint: 9 },
        { name: 'Physics', credits: 3, grade: 'B+', gradePoint: 8 },
        { name: 'Programming in C', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Engineering Drawing', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'English Communication', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'Environmental Science', credits: 2, grade: 'B', gradePoint: 7 },
        { name: 'Workshop', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'NSS/NCC', credits: 1, grade: 'S', gradePoint: 10 }
      ]},
      { semester: 2, gpa: 8.8, totalCredits: 24, earnedCredits: 24, year: 2022, subjects: [
        { name: 'Engineering Mathematics II', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Chemistry', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'Data Structures', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Digital Electronics', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'OOP with Java', credits: 4, grade: 'A', gradePoint: 9 },
        { name: 'Probability & Statistics', credits: 3, grade: 'B+', gradePoint: 8 },
        { name: 'Basic Electronics Lab', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'Sports', credits: 1, grade: 'S', gradePoint: 10 }
      ]},
      { semester: 3, gpa: 9.1, totalCredits: 22, earnedCredits: 22, year: 2022, subjects: [
        { name: 'Discrete Mathematics', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Computer Architecture', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'Algorithms', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Database Systems', credits: 4, grade: 'A', gradePoint: 9 },
        { name: 'Operating Systems', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'DBMS Lab', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'Algorithm Lab', credits: 1, grade: 'S', gradePoint: 10 }
      ]}
    ],
    [
      { semester: 1, gpa: 7.8, totalCredits: 24, earnedCredits: 24, year: 2021, subjects: [
        { name: 'Engineering Mathematics I', credits: 4, grade: 'B+', gradePoint: 8 },
        { name: 'Physics', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'Programming in C', credits: 4, grade: 'B+', gradePoint: 8 },
        { name: 'Engineering Drawing', credits: 3, grade: 'B', gradePoint: 7 },
        { name: 'English Communication', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'Environmental Science', credits: 2, grade: 'B+', gradePoint: 8 },
        { name: 'Workshop', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'NSS/NCC', credits: 1, grade: 'S', gradePoint: 10 }
      ]},
      { semester: 2, gpa: 8.2, totalCredits: 24, earnedCredits: 24, year: 2022, subjects: [
        { name: 'Engineering Mathematics II', credits: 4, grade: 'A', gradePoint: 9 },
        { name: 'Chemistry', credits: 3, grade: 'B+', gradePoint: 8 },
        { name: 'Data Structures', credits: 4, grade: 'A', gradePoint: 9 },
        { name: 'Digital Electronics', credits: 3, grade: 'B+', gradePoint: 8 },
        { name: 'OOP with Java', credits: 4, grade: 'B+', gradePoint: 8 },
        { name: 'Probability & Statistics', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'Basic Electronics Lab', credits: 2, grade: 'A+', gradePoint: 10 },
        { name: 'Sports', credits: 1, grade: 'S', gradePoint: 10 }
      ]}
    ]
  ];

  const studentProfiles = [
    { program: 'B.Tech', branch: 'Computer Science', batch: 2021, currentSemester: 3, advisor: faculty1._id, semSet: 0 },
    { program: 'B.Tech', branch: 'Computer Science', batch: 2021, currentSemester: 2, advisor: faculty1._id, semSet: 1 },
    { program: 'B.Tech', branch: 'Electronics', batch: 2021, currentSemester: 3, advisor: faculty2._id, semSet: 0 },
    { program: 'B.Tech', branch: 'Computer Science', batch: 2022, currentSemester: 1, advisor: faculty1._id, semSet: 1 },
    { program: 'B.Tech', branch: 'Mechanical', batch: 2022, currentSemester: 1, advisor: faculty2._id, semSet: 1 }
  ];

  for (let i = 0; i < createdStudentUsers.length; i++) {
    const user = createdStudentUsers[i];
    const profile = studentProfiles[i];
    const semRecords = semesterSets[profile.semSet] || semesterSets[0];

    const studentDoc = new Student({
      userId: user._id,
      studentId: user.userId,
      program: profile.program,
      branch: profile.branch,
      batch: profile.batch,
      currentSemester: profile.currentSemester,
      advisor: profile.advisor,
      semesterRecords: semRecords,
      dataHash: 'pending'
    });

    studentDoc.computeCGPA();
    const hash = generateHash(studentDoc);
    studentDoc.dataHash = hash;
    studentDoc.hashHistory = [{ hash, changedBy: admin._id, changedAt: new Date(), changeType: 'initial', previousHash: null }];
    studentDoc.integrityStatus = 'verified';
    await studentDoc.save();
  }

  // ── Announcements ──
  await Announcement.create([
    {
      title: 'End Semester Examinations Schedule 2024',
      content: 'The End Semester Examinations for all programs will commence from April 15, 2024. Students are advised to download their hall tickets from the portal. Practical examinations will begin from April 10, 2024. No requests for date changes will be entertained after March 31, 2024.',
      category: 'exam',
      priority: 'urgent',
      targetRoles: ['student', 'faculty'],
      createdBy: admin._id
    },
    {
      title: 'Result Declaration - Semester 5',
      content: 'The results for Semester 5 (November 2023) examinations have been published. Students can view their marks by logging into the student portal. Any discrepancies must be reported within 7 days through the faculty advisor.',
      category: 'result',
      priority: 'high',
      targetRoles: ['student'],
      createdBy: admin._id
    },
    {
      title: 'National Science Day Celebration',
      content: 'The institution will celebrate National Science Day on February 28, 2024. Students are encouraged to participate in various science exhibitions, poster presentations, and quiz competitions. Registration is open till February 20, 2024.',
      category: 'event',
      priority: 'normal',
      targetRoles: ['student', 'faculty'],
      createdBy: admin._id
    },
    {
      title: 'Data Integrity Verification Complete',
      content: 'The monthly academic data integrity verification has been completed successfully. All student records have been verified using SHA-256 cryptographic hashing. No tampering was detected. Next verification scheduled for March 31, 2024.',
      category: 'academic',
      priority: 'normal',
      targetRoles: ['faculty', 'admin'],
      createdBy: admin._id
    }
  ]);

  console.log('✅ Seed complete!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:   ADMIN001 / admin123');
  console.log('  Faculty: FAC001   / faculty123');
  console.log('  Student: STU2021001 / student123');
  console.log('\n🌐 Start server: node server.js');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
