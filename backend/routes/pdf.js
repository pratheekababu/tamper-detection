const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const Announcement = require('../models/Announcement');
const { authenticate, authorize } = require('../middleware/auth');
const { AuditLog } = require('../models/AuditLog');

const COLORS = {
  primary: '#6366f1',
  dark: '#0f172a',
  gray: '#64748b',
  light: '#f8fafc',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e2e8f0'
};

// ─── Student Transcript PDF ───────────────────────────────────────────────────
router.get('/transcript/:studentId?', authenticate, async (req, res) => {
  try {
    let student;

    if (req.user.role === 'student') {
      student = await Student.findOne({ userId: req.user._id })
        .populate('userId', 'name email department phone userId');
    } else if (req.params.studentId && ['faculty', 'admin'].includes(req.user.role)) {
      student = await Student.findById(req.params.studentId)
        .populate('userId', 'name email department phone userId');
    }

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="transcript-${student.studentId}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 120).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text('ACADEMIC TAMPER DETECTION SYSTEM', 50, 30, { align: 'center' });
    doc.fontSize(14).font('Helvetica')
      .text('Official Student Transcript', 50, 58, { align: 'center' });
    doc.fontSize(10)
      .text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 50, 82, { align: 'center' });

    // Integrity badge
    const integrityColor = student.integrityStatus === 'verified' ? '#10b981' : '#ef4444';
    const integrityText = student.integrityStatus === 'verified' ? '✓ VERIFIED' : '⚠ TAMPERED';
    doc.rect(doc.page.width - 160, 25, 110, 28).fill(integrityColor);
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text(integrityText, doc.page.width - 160, 34, { width: 110, align: 'center' });

    doc.moveDown(4);

    // ── Student Info ──
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('STUDENT INFORMATION');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
    doc.moveDown(0.5);

    const info = [
      ['Student ID', student.studentId],
      ['Full Name', student.userId?.name || 'N/A'],
      ['Email', student.userId?.email || 'N/A'],
      ['Program', student.program],
      ['Branch / Department', student.branch],
      ['Batch Year', student.batch],
      ['Current Semester', student.currentSemester],
    ];

    doc.font('Helvetica').fontSize(11).fillColor('#334155');
    const col1x = 50, col2x = 250, col3x = 350, col4x = 500;
    info.forEach(([label, value], i) => {
      const y = doc.y;
      if (i % 2 === 0) doc.rect(50, y - 4, doc.page.width - 100, 22).fill('#f8fafc');
      doc.fillColor('#64748b').text(label + ':', col1x, doc.y, { width: 180 });
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(String(value), col2x, doc.y - 12, { width: 300 });
      doc.font('Helvetica').moveDown(0.4);
    });

    // ── CGPA ──
    doc.moveDown(0.5);
    doc.rect(50, doc.y, doc.page.width - 100, 50).fill('#6366f1');
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica')
      .text('Cumulative GPA (CGPA)', 70, doc.y + 10);
    doc.fontSize(24).font('Helvetica-Bold')
      .text(student.cgpa.toFixed(2) + ' / 10.00', doc.page.width - 200, doc.y - 24, { width: 150, align: 'right' });
    doc.moveDown(3.5);

    // ── Semester Records ──
    if (student.semesterRecords && student.semesterRecords.length > 0) {
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('SEMESTER-WISE PERFORMANCE');
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
      doc.moveDown(0.5);

      student.semesterRecords.sort((a, b) => a.semester - b.semester).forEach(sem => {
        if (doc.y > 650) doc.addPage();
        doc.rect(50, doc.y, doc.page.width - 100, 28).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
          .text(`Semester ${sem.semester}  |  GPA: ${sem.gpa.toFixed(2)}  |  Credits: ${sem.earnedCredits}/${sem.totalCredits}  |  Year: ${sem.year}`,
            60, doc.y + 8, { width: doc.page.width - 120 });
        doc.moveDown(1.8);

        if (sem.subjects && sem.subjects.length > 0) {
          // Table header
          doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#e2e8f0');
          doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold')
            .text('Subject', 60, doc.y + 5)
            .text('Credits', 320, doc.y - 9)
            .text('Grade', 390, doc.y - 9)
            .text('Grade Points', 440, doc.y - 9);
          doc.moveDown(1.5);

          sem.subjects.forEach((sub, idx) => {
            if (idx % 2 === 0) doc.rect(50, doc.y - 2, doc.page.width - 100, 18).fill('#f8fafc');
            doc.fillColor('#334155').fontSize(10).font('Helvetica')
              .text(sub.name, 60, doc.y, { width: 250 })
              .text(String(sub.credits), 320, doc.y - 12, { width: 60 })
              .text(sub.grade, 390, doc.y - 12, { width: 40 })
              .text(sub.gradePoint?.toFixed(1) || '-', 440, doc.y - 12, { width: 80 });
            doc.moveDown(0.8);
          });
        }
        doc.moveDown(0.5);
      });
    }

    // ── Data Integrity Section ──
    if (doc.y > 680) doc.addPage();
    doc.moveDown(1);
    doc.rect(50, doc.y, doc.page.width - 100, 80).fill('#fef3c7');
    const iy = doc.y + 10;
    doc.fillColor('#92400e').fontSize(11).font('Helvetica-Bold').text('DATA INTEGRITY CERTIFICATE', 70, iy);
    doc.font('Helvetica').fontSize(9).fillColor('#78350f')
      .text('SHA-256 Hash:', 70, iy + 18)
      .text(student.dataHash, 155, iy + 18, { width: 360, lineBreak: false });
    doc.text('Status:', 70, iy + 36)
      .fillColor(student.integrityStatus === 'verified' ? '#065f46' : '#7f1d1d').font('Helvetica-Bold')
      .text(student.integrityStatus.toUpperCase(), 120, iy + 36);
    doc.fillColor('#78350f').font('Helvetica')
      .text(`Last Verified: ${student.lastVerified ? new Date(student.lastVerified).toLocaleString('en-IN') : 'N/A'}`, 70, iy + 52);
    doc.moveDown(5.5);

    // ── Footer ──
    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
      .text('This is a system-generated document. Tampering with this document is a criminal offense.', 50, footerY + 10, { align: 'center' })
      .text('Academic Tamper Detection Platform © ' + new Date().getFullYear(), 50, footerY + 24, { align: 'center' });

    doc.end();

    await AuditLog.create({
      action: 'PDF_GENERATED',
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name, userIdentifier: req.user.userId },
      targetStudent: student._id,
      details: { type: 'transcript', studentId: student.studentId },
      status: 'success', severity: 'low'
    });
  } catch (err) {
    console.error('PDF Error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'PDF generation failed.' });
  }
});

// ─── Announcement PDF ─────────────────────────────────────────────────────────
router.get('/announcement/:id', authenticate, async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name userId role');

    if (!ann) return res.status(404).json({ success: false, message: 'Announcement not found.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="announcement-${ann._id}.pdf"`);
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 100).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
      .text('OFFICIAL ANNOUNCEMENT', 50, 25, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text('Academic Tamper Detection Platform', 50, 52, { align: 'center' });

    const priorityColors = { urgent: '#ef4444', high: '#f59e0b', normal: '#6366f1', low: '#64748b' };
    doc.rect(doc.page.width - 130, 20, 80, 26).fill(priorityColors[ann.priority] || '#6366f1');
    doc.fillColor('#fff').fontSize(11).font('Helvetica-Bold')
      .text(ann.priority.toUpperCase(), doc.page.width - 130, 29, { width: 80, align: 'center' });

    doc.moveDown(4);
    doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text(ann.title);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#334155').fontSize(11).font('Helvetica').text(`Category: ${ann.category.toUpperCase()}  |  Published: ${new Date(ann.createdAt).toLocaleDateString('en-IN', { dateStyle: 'full' })}`);
    doc.fillColor('#64748b').text(`Issued by: ${ann.createdBy?.name || 'Admin'} (${ann.createdBy?.role || 'admin'})`);
    doc.moveDown(1.5);
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica').text(ann.content, { lineGap: 4 });

    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(9).text('Academic Tamper Detection Platform — Official Communication', 50, footerY + 12, { align: 'center' });

    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, message: 'PDF generation failed.' });
  }
});

module.exports = router;
