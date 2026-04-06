const express = require('express');
const serverless = require('serverless-http');
const { connectToDatabase } = require('../utils/db');

const studentsRoutes = require('../backend/routes/students');
const adminRoutes = require('../backend/routes/admin');
const facultyRoutes = require('../backend/routes/faculty');
const announcementsRoutes = require('../backend/routes/announcements');
const auditRoutes = require('../backend/routes/audit');
const pdfRoutes = require('../backend/routes/pdf');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (err) {
    console.error('DB connection failed:', err);
    return res.status(500).json({ success: false, message: 'Database connection failed.' });
  }
});

app.use('/students', studentsRoutes);
app.use('/admin', adminRoutes);
app.use('/faculty', facultyRoutes);
app.use('/announcements', announcementsRoutes);
app.use('/audit', auditRoutes);
app.use('/pdf', pdfRoutes);

module.exports = serverless(app);
