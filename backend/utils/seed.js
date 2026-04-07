const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
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
    Faculty.deleteMany({}),
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
    department: 'Administration',
    phone: '+91 98765 43210'
  });

  // ── Create Faculty Users ──
  const faculty1 = await User.create({
    userId: 'FAC001',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@atds.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Computer Science',
    phone: '+91 98765 11001'
  });

  const faculty2 = await User.create({
    userId: 'FAC002',
    name: 'Prof. Arun Mehta',
    email: 'arun.mehta@atds.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Electronics',
    phone: '+91 98765 11002'
  });

  const faculty3 = await User.create({
    userId: 'FAC003',
    name: 'Dr. Sneha Iyer',
    email: 'sneha.iyer@atds.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Computer Science',
    phone: '+91 98765 11003'
  });

  const faculty4 = await User.create({
    userId: 'FAC004',
    name: 'Prof. Vikram Desai',
    email: 'vikram.desai@atds.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Mechanical',
    phone: '+91 98765 11004'
  });

  // ── Create Faculty Profiles ──
  await Faculty.create({
    userId: faculty1._id,
    facultyId: 'FAC001',
    designation: 'Associate Professor',
    specialization: 'Artificial Intelligence & Machine Learning',
    qualifications: [
      { degree: 'PhD', field: 'Computer Science', institution: 'IIT Delhi', year: 2015 },
      { degree: 'M.Tech', field: 'Computer Science', institution: 'NIT Trichy', year: 2010 },
      { degree: 'B.Tech', field: 'Computer Science', institution: 'JNTU Hyderabad', year: 2008 }
    ],
    experience: 11,
    joiningDate: new Date('2015-07-15'),
    coursesTaught: [
      { name: 'Data Structures', code: 'CS201', semester: 3, program: 'B.Tech' },
      { name: 'Algorithms', code: 'CS301', semester: 5, program: 'B.Tech' },
      { name: 'Machine Learning', code: 'CS601', semester: 7, program: 'B.Tech' },
      { name: 'Deep Learning', code: 'CS701', semester: 1, program: 'M.Tech' }
    ],
    researchInterests: ['Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Reinforcement Learning'],
    publications: 28,
    officeRoom: 'CS-204',
    officeHours: 'Mon & Wed 2:00 PM - 4:00 PM',
    bio: 'Associate Professor specializing in AI/ML with 11+ years of academic experience. Published 28 papers in top-tier conferences including NeurIPS, ICML, and CVPR.'
  });

  await Faculty.create({
    userId: faculty2._id,
    facultyId: 'FAC002',
    designation: 'Professor',
    specialization: 'VLSI Design & Embedded Systems',
    qualifications: [
      { degree: 'PhD', field: 'Electronics Engineering', institution: 'IISc Bangalore', year: 2008 },
      { degree: 'M.Tech', field: 'VLSI Design', institution: 'IIT Bombay', year: 2003 },
      { degree: 'B.E.', field: 'Electronics & Communication', institution: 'Anna University', year: 2001 }
    ],
    experience: 18,
    joiningDate: new Date('2009-01-10'),
    coursesTaught: [
      { name: 'Digital Electronics', code: 'EC201', semester: 3, program: 'B.Tech' },
      { name: 'VLSI Design', code: 'EC401', semester: 7, program: 'B.Tech' },
      { name: 'Embedded Systems', code: 'EC501', semester: 5, program: 'B.Tech' },
      { name: 'Advanced VLSI', code: 'EC701', semester: 1, program: 'M.Tech' }
    ],
    researchInterests: ['System-on-Chip Design', 'Low Power VLSI', 'IoT', 'FPGA-based Systems'],
    publications: 45,
    officeRoom: 'EC-112',
    officeHours: 'Tue & Thu 10:00 AM - 12:00 PM',
    bio: 'Senior Professor with 18 years of experience in VLSI and embedded systems. Former researcher at Texas Instruments. 45 publications in IEEE and ACM journals.'
  });

  await Faculty.create({
    userId: faculty3._id,
    facultyId: 'FAC003',
    designation: 'Assistant Professor',
    specialization: 'Cybersecurity & Cryptography',
    qualifications: [
      { degree: 'PhD', field: 'Information Security', institution: 'IIT Kanpur', year: 2020 },
      { degree: 'M.Tech', field: 'Computer Science', institution: 'IIIT Hyderabad', year: 2016 },
      { degree: 'B.Tech', field: 'Information Technology', institution: 'VIT Vellore', year: 2014 }
    ],
    experience: 4,
    joiningDate: new Date('2021-08-01'),
    coursesTaught: [
      { name: 'Computer Networks', code: 'CS401', semester: 5, program: 'B.Tech' },
      { name: 'Information Security', code: 'CS501', semester: 7, program: 'B.Tech' },
      { name: 'Cryptography', code: 'CS601', semester: 1, program: 'M.Tech' }
    ],
    researchInterests: ['Post-Quantum Cryptography', 'Blockchain Security', 'Network Security', 'Privacy-Preserving Computation'],
    publications: 12,
    officeRoom: 'CS-108',
    officeHours: 'Wed & Fri 3:00 PM - 5:00 PM',
    bio: 'Young researcher specializing in cybersecurity and cryptography. Active contributor to open-source security tools. 12 publications in top security venues.'
  });

  await Faculty.create({
    userId: faculty4._id,
    facultyId: 'FAC004',
    designation: 'Associate Professor',
    specialization: 'Thermodynamics & Heat Transfer',
    qualifications: [
      { degree: 'PhD', field: 'Mechanical Engineering', institution: 'IIT Madras', year: 2012 },
      { degree: 'M.E.', field: 'Thermal Engineering', institution: 'PSG Tech Coimbatore', year: 2007 },
      { degree: 'B.E.', field: 'Mechanical Engineering', institution: 'Osmania University', year: 2005 }
    ],
    experience: 14,
    joiningDate: new Date('2013-06-20'),
    coursesTaught: [
      { name: 'Engineering Thermodynamics', code: 'ME201', semester: 3, program: 'B.Tech' },
      { name: 'Heat Transfer', code: 'ME301', semester: 5, program: 'B.Tech' },
      { name: 'Fluid Mechanics', code: 'ME401', semester: 4, program: 'B.Tech' }
    ],
    researchInterests: ['Computational Fluid Dynamics', 'Renewable Energy Systems', 'Thermal Management', 'Green Manufacturing'],
    publications: 32,
    officeRoom: 'ME-305',
    officeHours: 'Mon & Thu 11:00 AM - 1:00 PM',
    bio: 'Experienced faculty in thermal sciences with industrial consulting experience at Tata Motors and Ashok Leyland. 32 publications in energy and thermal engineering journals.'
  });

  console.log('✅ Faculty profiles created!');

  // ── Create Student Users ──
  const studentUsers = [
    { userId: 'STU2021001', name: 'Arjun Patel', email: 'arjun.patel@student.atds.edu', department: 'Computer Science', phone: '+91 99887 10001' },
    { userId: 'STU2021002', name: 'Meera Krishnan', email: 'meera.k@student.atds.edu', department: 'Computer Science', phone: '+91 99887 10002' },
    { userId: 'STU2021003', name: 'Rohit Verma', email: 'rohit.v@student.atds.edu', department: 'Electronics', phone: '+91 99887 10003' },
    { userId: 'STU2022001', name: 'Ananya Singh', email: 'ananya.s@student.atds.edu', department: 'Computer Science', phone: '+91 99887 10004' },
    { userId: 'STU2022002', name: 'Kiran Reddy', email: 'kiran.r@student.atds.edu', department: 'Mechanical', phone: '+91 99887 10005' },
    { userId: 'STU2022003', name: 'Preethi Nair', email: 'preethi.n@student.atds.edu', department: 'Computer Science', phone: '+91 99887 10006' },
    { userId: 'STU2023001', name: 'Aditya Gupta', email: 'aditya.g@student.atds.edu', department: 'Electronics', phone: '+91 99887 10007' },
    { userId: 'STU2023002', name: 'Divya Menon', email: 'divya.m@student.atds.edu', department: 'Computer Science', phone: '+91 99887 10008' }
  ];

  const createdStudentUsers = await Promise.all(studentUsers.map(u =>
    User.create({ ...u, password: 'student123', role: 'student' })
  ));

  // Sample semester data
  const semesterSets = [
    // Set 0: 3 semesters, strong performer
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
    // Set 1: 2 semesters, decent performer
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
    ],
    // Set 2: 4 semesters, top performer
    [
      { semester: 1, gpa: 9.2, totalCredits: 24, earnedCredits: 24, year: 2022, subjects: [
        { name: 'Engineering Mathematics I', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Physics', credits: 3, grade: 'A+', gradePoint: 10 },
        { name: 'Programming in C', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Engineering Drawing', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'English Communication', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'Environmental Science', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'Workshop', credits: 2, grade: 'A', gradePoint: 9 },
        { name: 'NSS/NCC', credits: 1, grade: 'S', gradePoint: 10 }
      ]},
      { semester: 2, gpa: 9.4, totalCredits: 24, earnedCredits: 24, year: 2022, subjects: [
        { name: 'Engineering Mathematics II', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Chemistry', credits: 3, grade: 'A+', gradePoint: 10 },
        { name: 'Data Structures', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Digital Electronics', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'OOP with Java', credits: 4, grade: 'A+', gradePoint: 10 },
        { name: 'Probability & Statistics', credits: 3, grade: 'A', gradePoint: 9 },
        { name: 'Basic Electronics Lab', credits: 2, grade: 'A+', gradePoint: 10 },
        { name: 'Sports', credits: 1, grade: 'S', gradePoint: 10 }
      ]}
    ],
    // Set 3: 1 semester, new student
    [
      { semester: 1, gpa: 7.4, totalCredits: 24, earnedCredits: 22, year: 2023, subjects: [
        { name: 'Engineering Mathematics I', credits: 4, grade: 'B', gradePoint: 7 },
        { name: 'Physics', credits: 3, grade: 'B+', gradePoint: 8 },
        { name: 'Programming in C', credits: 4, grade: 'A', gradePoint: 9 },
        { name: 'Engineering Drawing', credits: 3, grade: 'B', gradePoint: 7 },
        { name: 'English Communication', credits: 2, grade: 'B+', gradePoint: 8 },
        { name: 'Environmental Science', credits: 2, grade: 'C', gradePoint: 5 },
        { name: 'Workshop', credits: 2, grade: 'B+', gradePoint: 8 },
        { name: 'NSS/NCC', credits: 1, grade: 'S', gradePoint: 10 }
      ]}
    ]
  ];

  const studentProfiles = [
    { program: 'B.Tech', branch: 'Computer Science', batch: 2021, currentSemester: 3, advisor: faculty1._id, semSet: 0 },
    { program: 'B.Tech', branch: 'Computer Science', batch: 2021, currentSemester: 2, advisor: faculty1._id, semSet: 1 },
    { program: 'B.Tech', branch: 'Electronics', batch: 2021, currentSemester: 3, advisor: faculty2._id, semSet: 0 },
    { program: 'B.Tech', branch: 'Computer Science', batch: 2022, currentSemester: 2, advisor: faculty3._id, semSet: 2 },
    { program: 'B.Tech', branch: 'Mechanical', batch: 2022, currentSemester: 2, advisor: faculty4._id, semSet: 1 },
    { program: 'MCA', branch: 'Computer Science', batch: 2022, currentSemester: 2, advisor: faculty1._id, semSet: 2 },
    { program: 'B.Tech', branch: 'Electronics', batch: 2023, currentSemester: 1, advisor: faculty2._id, semSet: 3 },
    { program: 'B.Tech', branch: 'Computer Science', batch: 2023, currentSemester: 1, advisor: faculty3._id, semSet: 3 }
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

  console.log('✅ Student profiles created!');

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

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:   ADMIN001   / admin123');
  console.log('  Faculty: FAC001     / faculty123');
  console.log('  Faculty: FAC002     / faculty123');
  console.log('  Faculty: FAC003     / faculty123');
  console.log('  Faculty: FAC004     / faculty123');
  console.log('  Student: STU2021001 / student123');
  console.log('  Student: STU2021002 / student123');
  console.log('  Student: STU2022001 / student123');
  console.log('  Student: STU2023001 / student123');
  console.log(`\n📊 Data created: 1 Admin, 4 Faculty, ${createdStudentUsers.length} Students, 4 Announcements`);
  console.log('🌐 Start server: npm run dev');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
