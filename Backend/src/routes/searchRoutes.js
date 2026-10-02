const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ResearchInfo = require('../models/ResearchInfo');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/v1/search
 * Global Project Search & Combinable Multi-Filter API
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      q,
      academicYear,
      semester,
      department,
      supervisorId,
      coordinatorId,
      technology,
      domain,
      status,
      hasPatent,
      hasPublication,
      page = 1,
      limit = 20
    } = req.query;

    let filter = {};

    // Role isolation logic
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user._id;
    } else if (req.user.role === 'SUPERVISOR') {
      filter.$or = [{ supervisorId: req.user._id }, { coSupervisorId: req.user._id }];
    } else if (req.user.role === 'COORDINATOR') {
      filter.coordinatorId = req.user._id;
    }

    // Text search query across Project ID, Title, Student Name, Register No, Keywords, Abstract
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      const textConditions = [
        { projectId: searchRegex },
        { title: searchRegex },
        { studentName: searchRegex },
        { registerNumber: searchRegex },
        { keywords: searchRegex },
        { abstract: searchRegex }
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: textConditions }];
        delete filter.$or;
      } else {
        filter.$or = textConditions;
      }
    }

    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (department) filter.department = department.toUpperCase();
    if (supervisorId) filter.supervisorId = supervisorId;
    if (coordinatorId) filter.coordinatorId = coordinatorId;
    if (technology) filter.technology = technology;
    if (domain) filter.domain = domain;
    if (status) filter.status = status;

    // Filter by Patent / Publication if requested
    if (hasPatent === 'true' || hasPublication === 'true') {
      const researchMatch = {};
      if (hasPatent === 'true') researchMatch.hasPatent = true;
      if (hasPublication === 'true') researchMatch.hasPublication = true;

      const matchingResearch = await ResearchInfo.find(researchMatch).select('projectId');
      const projIds = matchingResearch.map(r => r.projectId);
      filter._id = { $in: projIds };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('studentId', 'name email registerNumber department')
        .populate('supervisorId', 'name email')
        .populate('coordinatorId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      projects
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
