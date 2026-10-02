const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ResearchInfo = require('../models/ResearchInfo');
const { generatePDFReport, generateExcelReport, generateCSVReport } = require('../services/reportService');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/v1/reports/download
 * Export PDF, Excel, or CSV report with filters
 */
router.get('/download', authenticate, async (req, res) => {
  try {
    const { format = 'pdf', type = 'summary', academicYear, semester, status, supervisorId, coordinatorId } = req.query;

    let filter = {};

    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user._id;
    } else if (req.user.role === 'SUPERVISOR') {
      filter.$or = [{ supervisorId: req.user._id }, { coSupervisorId: req.user._id }];
    } else if (req.user.role === 'COORDINATOR') {
      filter.coordinatorId = req.user._id;
    }

    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (status) filter.status = status;
    if (supervisorId) filter.supervisorId = supervisorId;
    if (coordinatorId) filter.coordinatorId = coordinatorId;

    if (type === 'patent') {
      const pRes = await ResearchInfo.find({ hasPatent: true }).select('projectId');
      filter._id = { $in: pRes.map(r => r.projectId) };
    } else if (type === 'publication') {
      const pubRes = await ResearchInfo.find({ hasPublication: true }).select('projectId');
      filter._id = { $in: pubRes.map(r => r.projectId) };
    }

    const projects = await Project.find(filter)
      .populate('studentId', 'name email registerNumber department')
      .populate('supervisorId', 'name email')
      .populate('coordinatorId', 'name email')
      .sort({ updatedAt: -1 });

    const title = `KLU Academic Project Report - ${type.toUpperCase()}`;
    const subtitle = `Filter: ${academicYear || 'All Years'} | ${semester || 'All Semesters'} | Status: ${status || 'All'}`;

    if (format === 'excel' || format === 'xlsx') {
      return await generateExcelReport(res, title, projects);
    } else if (format === 'csv') {
      return generateCSVReport(res, title, projects);
    } else {
      return generatePDFReport(res, title, subtitle, projects);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
