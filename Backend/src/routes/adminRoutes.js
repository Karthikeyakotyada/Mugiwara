const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');
const { processApprovedProjectCloudinaryAutomation } = require('../services/cloudinaryService');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/v1/admin/users
 * Manage User Records & Roles
 */
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/admin/users
 * Create or update user role/active status
 */
router.post('/users', async (req, res) => {
  try {
    const { email, name, role, department, registerNumber, isActive } = req.body;

    if (!email || !email.endsWith('@klu.ac.in')) {
      return res.status(400).json({ success: false, message: 'Valid @klu.ac.in email is required.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user.name = name || user.name;
      user.role = role || user.role;
      user.department = department || user.department;
      user.registerNumber = registerNumber || user.registerNumber;
      if (typeof isActive === 'boolean') user.isActive = isActive;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        role: role || 'STUDENT',
        department: department || 'ECE',
        registerNumber,
        isActive: isActive !== false
      });
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ADMIN_USER_UPDATED',
      entityType: 'USER',
      entityId: user._id.toString(),
      metadata: { role: user.role, email: user.email }
    });

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/v1/admin/users/:id
 * Update specific user role, department, or active status by ID
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { role, department, registerNumber, isActive, name } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department) user.department = department.toUpperCase().trim();
    if (registerNumber !== undefined) user.registerNumber = registerNumber.toUpperCase().trim();
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ADMIN_USER_ROLE_UPDATED',
      entityType: 'USER',
      entityId: user._id.toString(),
      metadata: { newRole: user.role, email: user.email, department: user.department }
    });

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * POST /api/v1/admin/projects/:id/assign
 * Reassign Supervisor or Coordinator to a Project
 */
router.post('/projects/:id/assign', async (req, res) => {
  try {
    const { supervisorId, coSupervisorId, coordinatorId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const prevSup = project.supervisorId;
    const prevCoord = project.coordinatorId;

    if (supervisorId) {
      const sup = await User.findOne({ _id: supervisorId, role: 'SUPERVISOR', isActive: true });
      if (!sup) return res.status(400).json({ success: false, message: 'Invalid or inactive Supervisor selected.' });
      project.supervisorId = supervisorId;
    }

    if (coSupervisorId !== undefined) {
      if (coSupervisorId) {
        const coSup = await User.findOne({ _id: coSupervisorId, role: 'SUPERVISOR', isActive: true });
        if (!coSup) return res.status(400).json({ success: false, message: 'Invalid or inactive Co-Supervisor selected.' });
      }
      project.coSupervisorId = coSupervisorId || null;
    }

    if (coordinatorId) {
      const coord = await User.findOne({ _id: coordinatorId, role: 'COORDINATOR', isActive: true });
      if (!coord) return res.status(400).json({ success: false, message: 'Invalid or inactive Coordinator selected.' });
      project.coordinatorId = coordinatorId;
    }

    await project.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ADMIN_PROJECT_REASSIGNED',
      entityType: 'PROJECT',
      entityId: project.projectId,
      metadata: {
        prevSupervisorId: prevSup,
        newSupervisorId: project.supervisorId,
        prevCoordinatorId: prevCoord,
        newCoordinatorId: project.coordinatorId
      }
    });

    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/admin/projects/:id/retry-drive (Legacy alias) & POST /api/v1/admin/projects/:id/retry-cloudinary
 * Triggers idempotent retry for failed Cloudinary automation
 */
const handleCloudinaryRetry = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      status: 'AUTOMATION_FAILED'
    });

    if (!project) {
      return res.status(400).json({ success: false, message: 'Project is not in AUTOMATION_FAILED state or not found.' });
    }

    // Trigger Cloudinary automation asynchronously
    processApprovedProjectCloudinaryAutomation(project._id, req.user);

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ADMIN_CLOUDINARY_RETRY_TRIGGERED',
      entityType: 'PROJECT',
      entityId: project.projectId
    });

    return res.json({ success: true, message: `Cloudinary automation retry initiated for ${project.projectId}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/projects/:id/retry-drive', handleCloudinaryRetry);
router.post('/projects/:id/retry-cloudinary', handleCloudinaryRetry);

/**
 * GET /api/v1/admin/audit-logs
 * Fetch System Audit Logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments()
    ]);

    return res.json({ success: true, total, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/admin/configs & POST /api/v1/admin/configs
 * System Configuration Management
 */
router.get('/configs', async (req, res) => {
  try {
    const configs = await SystemConfig.find();
    return res.json({ success: true, configs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/configs', async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true }
    );
    return res.json({ success: true, config });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
