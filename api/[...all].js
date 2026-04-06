const express = require('express');
const serverless = require('serverless-http');

const studentsRoutes = require('../backend/routes/students');
const adminRoutes = require('../backend/routes/admin');
const facultyRoutes = require('../backend/routes/faculty');
const announcementsRoutes = require('../backend/routes/announcements');
const auditRoutes = require('../backend/routes/audit');
const pdfRoutes = require('../backend/routes/pdf');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use('/api/students', studentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/pdf', pdfRoutes);

module.exports = serverless(app);
