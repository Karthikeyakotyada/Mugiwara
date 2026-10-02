const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ResearchInfo = require('../models/ResearchInfo');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/v1/analytics
 * Database aggregated analytics endpoint for Google Charts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let baseMatch = {};

    if (req.user.role === 'STUDENT') {
      baseMatch.studentId = req.user._id;
    } else if (req.user.role === 'SUPERVISOR') {
      baseMatch.$or = [{ supervisorId: req.user._id }, { coSupervisorId: req.user._id }];
    } else if (req.user.role === 'COORDINATOR') {
      baseMatch.coordinatorId = req.user._id;
    }

    // Overall Counts
    const [
      totalProjects,
      approvedProjects,
      pendingProjects,
      rejectedProjects,
      supervisorCount,
      coordinatorCount
    ] = await Promise.all([
      Project.countDocuments(baseMatch),
      Project.countDocuments({ ...baseMatch, status: { $in: ['APPROVED', 'LOCKED'] } }),
      Project.countDocuments({ ...baseMatch, status: { $in: ['SUPERVISOR_REVIEW', 'COORDINATOR_REVIEW'] } }),
      Project.countDocuments({ ...baseMatch, status: { $in: ['REJECTED_BY_SUPERVISOR', 'REJECTED_BY_COORDINATOR'] } }),
      User.countDocuments({ role: 'SUPERVISOR', isActive: true }),
      User.countDocuments({ role: 'COORDINATOR', isActive: true })
    ]);

    // Technology Distribution
    const techAggregation = await Project.aggregate([
      { $match: baseMatch },
      { $unwind: '$technology' },
      { $group: { _id: '$technology', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Domain Breakdown
    const domainAggregation = await Project.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Year-wise Statistics
    const yearAggregation = await Project.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$academicYear', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Semester-wise Statistics
    const semAggregation = await Project.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$semester', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Patent & Publication Stats
    const [patentCount, publicationCount] = await Promise.all([
      ResearchInfo.countDocuments({ hasPatent: true }),
      ResearchInfo.countDocuments({ hasPublication: true })
    ]);

    // Recent Submissions
    const recentSubmissions = await Project.find(baseMatch)
      .populate('studentId', 'name')
      .populate('supervisorId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      summary: {
        totalProjects,
        approvedProjects,
        pendingProjects,
        rejectedProjects,
        supervisorCount,
        coordinatorCount,
        patentCount,
        publicationCount
      },
      charts: {
        technology: techAggregation.map(t => [t._id || 'Unspecified', t.count]),
        domain: domainAggregation.map(d => [d._id || 'General', d.count]),
        year: yearAggregation.map(y => [y._id || '2026', y.count]),
        semester: semAggregation.map(s => [s._id || 'Semester 1', s.count])
      },
      recentSubmissions
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
