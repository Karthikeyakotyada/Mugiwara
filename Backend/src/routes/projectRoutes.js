const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');

const ProjectVersion = require('../models/ProjectVersion');
const ProjectFile = require('../models/ProjectFile');
const Review = require('../models/Review');
const ApprovalHistory = require('../models/ApprovalHistory');
const AuditLog = require('../models/AuditLog');
const ResearchInfo = require('../models/ResearchInfo');
const User = require('../models/User');
const { generateProjectId } = require('../services/projectIdService');
const {
  processApprovedProjectCloudinaryAutomation,
  uploadFileToCloudinary,
  getSecureDownloadUrl
} = require('../services/cloudinaryService');
const { upload, validateFileMagicBytes, cleanTempFile } = require('../services/fileValidationService');
const { sendNotification } = require('../services/emailService');
const { authenticate, requireRole } = require('../middleware/auth');

const MANDATORY_DOCS = [
  'FINAL_REPORT',
  'PRESENTATION',
  'APPROVAL_CERTIFICATE',
  'PLAGIARISM_REPORT',
  'POSTER',
  'SOURCE_CODE'
];

/**
 * GET /api/v1/projects
 * List projects with strict backend query isolation per role
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'STUDENT') {
      query.studentId = req.user._id;
    } else if (req.user.role === 'SUPERVISOR') {
      query.$or = [{ supervisorId: req.user._id }, { coSupervisorId: req.user._id }];
    } else if (req.user.role === 'COORDINATOR') {
      query.coordinatorId = req.user._id;
    }
    // ADMIN has unrestricted visibility

    // Filter params
    const { status, academicYear, semester, technology, domain, search } = req.query;

    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (technology) query.technology = technology;
    if (domain) query.domain = domain;

    if (search) {
      query.$or = [
        { projectId: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { studentName: new RegExp(search, 'i') },
        { registerNumber: new RegExp(search, 'i') }
      ];
    }

    const projects = await Project.find(query)
      .populate('studentId', 'name email registerNumber department')
      .populate('supervisorId', 'name email')
      .populate('coSupervisorId', 'name email')
      .populate('coordinatorId', 'name email')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/projects/options/faculty
 * Get active Supervisors and Coordinators for assignment dropdowns
 */
router.get('/options/faculty', authenticate, async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'SUPERVISOR', isActive: true })
      .select('name email department')
      .sort({ name: 1 });
    const coordinators = await User.find({ role: 'COORDINATOR', isActive: true })
      .select('name email department')
      .sort({ name: 1 });
    return res.json({ success: true, supervisors, coordinators });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/projects/files/:fileId/download
 * Download file from local storage
 */
router.get('/files/:fileId/download', authenticate, async (req, res) => {
  try {
    const fileDoc = await ProjectFile.findById(req.params.fileId);
    if (!fileDoc) {
      return res.status(404).json({ success: false, message: 'File record not found.' });
    }

    if (fileDoc.cloudinaryPublicId) {
      const ext = (path.extname(fileDoc.originalName) || '.pdf').replace('.', '');
      const secureUrl = getSecureDownloadUrl(fileDoc.cloudinaryPublicId, ext);
      if (secureUrl) {
        return res.redirect(secureUrl);
      }
    }

    let absolutePath = fileDoc.filePath;
    if (!path.isAbsolute(absolutePath)) {
      absolutePath = path.join(__dirname, '../../', fileDoc.filePath);
    }

    if (fs.existsSync(absolutePath)) {
      res.setHeader('Content-Type', fileDoc.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.originalName}"`);
      return res.sendFile(absolutePath);
    }

    if (fileDoc.cloudinaryUrl) {
      return res.redirect(fileDoc.cloudinaryUrl);
    }

    return res.status(404).json({ success: false, message: 'File does not exist on disk repository or Cloudinary.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/projects/files/:fileId/view
 * View file inline (e.g. PDF preview stream)
 */
router.get('/files/:fileId/view', authenticate, async (req, res) => {
  try {
    const fileDoc = await ProjectFile.findById(req.params.fileId);
    if (!fileDoc) {
      return res.status(404).json({ success: false, message: 'File record not found.' });
    }

    if (fileDoc.cloudinaryPublicId) {
      const ext = (path.extname(fileDoc.originalName) || '.pdf').replace('.', '');
      const secureUrl = getSecureDownloadUrl(fileDoc.cloudinaryPublicId, ext);
      if (secureUrl) {
        return res.redirect(secureUrl);
      }
    }

    let absolutePath = fileDoc.filePath;
    if (!path.isAbsolute(absolutePath)) {
      absolutePath = path.join(__dirname, '../../', fileDoc.filePath);
    }

    if (fs.existsSync(absolutePath)) {
      res.setHeader('Content-Type', fileDoc.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName}"`);
      return res.sendFile(absolutePath);
    }

    if (fileDoc.cloudinaryUrl) {
      return res.redirect(fileDoc.cloudinaryUrl);
    }

    return res.status(404).json({ success: false, message: 'File does not exist on disk repository or Cloudinary.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/projects/:id
 * Get complete project details with files, versions, reviews, history, research info
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('studentId', 'name email registerNumber department')
      .populate('supervisorId', 'name email')
      .populate('coSupervisorId', 'name email')
      .populate('coordinatorId', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Authorization check
    if (req.user.role === 'STUDENT' && project.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view your own projects.' });
    }
    if (req.user.role === 'SUPERVISOR' &&
        project.supervisorId._id.toString() !== req.user._id.toString() &&
        (!project.coSupervisorId || project.coSupervisorId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not assigned to this project.' });
    }
    if (req.user.role === 'COORDINATOR' && project.coordinatorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not the assigned coordinator for this project.' });
    }

    const versions = await ProjectVersion.find({ projectId: project._id }).sort({ versionNumber: -1 });
    const files = await ProjectFile.find({ projectId: project._id });
    const reviews = await Review.find({ projectId: project._id }).sort({ createdAt: -1 });
    const history = await ApprovalHistory.find({ projectId: project._id }).sort({ createdAt: 1 });
    const researchInfo = await ResearchInfo.findOne({ projectId: project._id });

    return res.json({
      success: true,
      project,
      versions,
      files,
      reviews,
      history,
      researchInfo
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/projects/upload-document
 * Uploads a document with Multer diskStorage, stream limits (50MB), and magic byte verification
 */
router.post('/upload-document', authenticate, requireRole(['STUDENT']), (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File size exceeds maximum permitted limit of 50 MB.' });
      }
      return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { tempProjectId, documentType } = req.body;
    const tempFile = req.file;

    try {
      if (!documentType) {
        cleanTempFile(tempFile.path);
        return res.status(400).json({ success: false, message: 'documentType parameter is required.' });
      }

      // Content-level magic bytes inspection
      await validateFileMagicBytes(tempFile.path, documentType, tempFile.originalname);

      // Upload directly to Cloudinary
      let cloudinaryResult = null;
      try {
        const studentFolder = `klu_repository/submissions/${req.user.registerNumber || req.user._id}`;
        cloudinaryResult = await uploadFileToCloudinary(tempFile.path, {
          folder: studentFolder,
          originalName: tempFile.originalname
        });
      } catch (cErr) {
        console.warn('[UploadDocument] Cloudinary immediate upload notice:', cErr.message);
      }

      return res.json({
        success: true,
        file: {
          documentType,
          originalName: tempFile.originalname,
          tempPath: tempFile.path,
          mimeType: tempFile.mimetype,
          fileSize: tempFile.size,
          cloudinaryPublicId: cloudinaryResult?.publicId || null,
          cloudinaryUrl: cloudinaryResult?.secureUrl || null,
          isUploadedToCloudinary: !!cloudinaryResult?.success
        }
      });
    } catch (vErr) {
      cleanTempFile(tempFile.path);
      return res.status(400).json({ success: false, message: vErr.message });
    }
  });
});

/**
 * POST /api/v1/projects/draft
 * Create or save project draft
 */
router.post('/draft', authenticate, requireRole(['STUDENT']), async (req, res) => {
  try {
    const {
      projectId: draftDbId,
      academicYear,
      semester,
      department,
      title,
      abstract,
      keywords,
      technology,
      domain,
      supervisorId,
      coSupervisorId,
      coordinatorId
    } = req.body;

    let project;
    if (draftDbId) {
      project = await Project.findOne({ _id: draftDbId, studentId: req.user._id, status: 'DRAFT' });
      if (!project) {
        return res.status(404).json({ success: false, message: 'Draft not found or not editable.' });
      }

      project.academicYear = academicYear || project.academicYear;
      project.semester = semester || project.semester;
      project.department = (department || project.department).toUpperCase();
      project.title = title || project.title;
      project.abstract = abstract || project.abstract;
      project.keywords = keywords || project.keywords;
      project.technology = technology || project.technology;
      project.domain = domain || project.domain;
      project.supervisorId = supervisorId || project.supervisorId;
      project.coSupervisorId = coSupervisorId || project.coSupervisorId;
      project.coordinatorId = coordinatorId || project.coordinatorId;
      await project.save();
    } else {
      // Validate assigned supervisors & coordinator are active
      if (supervisorId) {
        const sup = await User.findOne({ _id: supervisorId, role: 'SUPERVISOR', isActive: true });
        if (!sup) return res.status(400).json({ success: false, message: 'Selected primary supervisor is invalid or inactive.' });
      }
      if (coordinatorId) {
        const coord = await User.findOne({ _id: coordinatorId, role: 'COORDINATOR', isActive: true });
        if (!coord) return res.status(400).json({ success: false, message: 'Selected coordinator is invalid or inactive.' });
      }

      // Generate temporary draft ID code until final submit
      const draftCode = `DRAFT-${Date.now().toString().slice(-6)}`;

      project = await Project.create({
        projectId: draftCode,
        academicYear: academicYear || '2026-27',
        semester: semester || 'Semester 1',
        department: (department || req.user.department || 'ECE').toUpperCase(),
        studentId: req.user._id,
        studentName: req.user.name,
        registerNumber: req.user.registerNumber || 'PENDING',
        email: req.user.email,
        title: title || 'Untitled Project Draft',
        abstract: abstract || 'Draft Abstract',
        keywords: keywords || [],
        technology: technology || [],
        domain: domain || 'General',
        supervisorId: supervisorId || (await User.findOne({ role: 'SUPERVISOR', isActive: true }))._id,
        coordinatorId: coordinatorId || (await User.findOne({ role: 'COORDINATOR', isActive: true }))._id,
        coSupervisorId: coSupervisorId || null,
        status: 'DRAFT'
      });
    }

    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/projects/submit
 * Final submission wizard handler: validates 6/6 files, generates atomic Project ID, creates v1 snapshot
 */
router.post('/submit', authenticate, requireRole(['STUDENT']), async (req, res) => {
  try {
    const {
      draftId,
      academicYear,
      semester,
      department,
      title,
      abstract,
      keywords,
      technology,
      domain,
      supervisorId,
      coSupervisorId,
      coordinatorId,
      files,
      researchInfo
    } = req.body;

    // Auto-assign supervisor & coordinator if not explicitly provided
    let supervisor;
    if (supervisorId && mongoose.Types.ObjectId.isValid(supervisorId)) {
      supervisor = await User.findOne({ _id: supervisorId, role: 'SUPERVISOR', isActive: true });
    }
    if (!supervisor) {
      const deptCode = (department || req.user.department || 'ECE').toUpperCase();
      supervisor = await User.findOne({ role: 'SUPERVISOR', department: deptCode, isActive: true })
        || await User.findOne({ role: 'SUPERVISOR', isActive: true });
    }
    if (!supervisor) {
      return res.status(400).json({ success: false, message: 'No active Supervisor available in system.' });
    }

    let coordinator;
    if (coordinatorId && mongoose.Types.ObjectId.isValid(coordinatorId)) {
      coordinator = await User.findOne({ _id: coordinatorId, role: 'COORDINATOR', isActive: true });
    }
    if (!coordinator) {
      const deptCode = (department || req.user.department || 'ECE').toUpperCase();
      coordinator = await User.findOne({ role: 'COORDINATOR', department: deptCode, isActive: true })
        || await User.findOne({ role: 'COORDINATOR', isActive: true });
    }
    if (!coordinator) {
      return res.status(400).json({ success: false, message: 'No active Coordinator available in system.' });
    }

    // Validate 6 Mandatory Documents
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ success: false, message: 'Uploaded project documents are required.' });
    }

    const validFiles = files.filter(Boolean);
    const uploadedDocTypes = validFiles.map(f => f.documentType).filter(Boolean);
    const missingDocs = MANDATORY_DOCS.filter(docType => !uploadedDocTypes.includes(docType));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Submission Error: Missing mandatory document(s): ${missingDocs.join(', ')}. All 6 mandatory files must be uploaded.`
      });
    }

    const deptCode = (department || req.user.department || 'ECE').toUpperCase();
    const finalProjectIdCode = await generateProjectId(deptCode, academicYear);

    let project;
    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      project = await Project.findOne({ _id: draftId, studentId: req.user._id });
    }

    if (!project) {
      project = new Project({
        studentId: req.user._id,
        email: req.user.email
      });
    }

    if (req.body.registerNumber) {
      req.user.registerNumber = req.body.registerNumber.trim();
    }
    if (deptCode) {
      req.user.department = deptCode;
    }
    await req.user.save();

    project.projectId = finalProjectIdCode;
    project.academicYear = academicYear;
    project.semester = semester;
    project.department = deptCode;
    project.studentName = req.user.name;
    project.registerNumber = req.user.registerNumber || 'REG' + Date.now().toString().slice(-5);
    project.title = title;
    project.abstract = abstract;
    project.keywords = Array.isArray(keywords) ? keywords : [keywords];
    project.technology = Array.isArray(technology) ? technology : [technology];
    project.domain = domain;
    project.supervisorId = supervisor._id;
    project.coSupervisorId = (coSupervisorId && mongoose.Types.ObjectId.isValid(coSupervisorId)) ? coSupervisorId : null;
    project.coordinatorId = coordinator._id;
    project.status = 'SUPERVISOR_REVIEW';
    project.currentVersion = 1;
    await project.save();

    // Create Version 1 Document
    const versionDoc = await ProjectVersion.create({
      projectId: project._id,
      versionNumber: 1,
      snapshot: {
        title,
        abstract,
        keywords,
        technology,
        domain,
        academicYear,
        semester,
        department: deptCode
      },
      submittedBy: req.user._id
    });

    // Save Project File references with Cloudinary metadata
    for (const f of files) {
      let cPubId = f.cloudinaryPublicId || null;
      let cUrl = f.cloudinaryUrl || null;
      let isCloud = !!f.isUploadedToCloudinary;

      // If not yet uploaded to Cloudinary, upload now
      if (!isCloud && f.tempPath && fs.existsSync(f.tempPath)) {
        try {
          const cRes = await uploadFileToCloudinary(f.tempPath, {
            folder: `klu_repository/submissions/${project.projectId}`,
            originalName: f.originalName
          });
          if (cRes.success) {
            cPubId = cRes.publicId;
            cUrl = cRes.secureUrl;
            isCloud = true;
          }
        } catch (e) {
          console.warn('[Submit] Cloudinary sync warning:', e.message);
        }
      }

      await ProjectFile.create({
        projectId: project._id,
        versionId: versionDoc._id,
        documentType: f.documentType,
        originalName: f.originalName,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
        filePath: f.tempPath || f.filePath || 'uploads/temp',
        cloudinaryPublicId: cPubId,
        cloudinaryUrl: cUrl,
        isUploadedToCloudinary: isCloud
      });
    }

    // Save Research Info if provided
    if (researchInfo) {
      await ResearchInfo.create({
        projectId: project._id,
        hasPatent: !!researchInfo.hasPatent,
        patentStatus: researchInfo.patentStatus || null,
        patentNumber: researchInfo.patentNumber || null,
        patentTitle: researchInfo.patentTitle || null,
        patentDate: researchInfo.patentDate || null,
        hasPublication: !!researchInfo.hasPublication,
        publicationStatus: researchInfo.publicationStatus || null,
        paperTitle: researchInfo.paperTitle || null,
        journalConference: researchInfo.journalConference || null,
        doi: researchInfo.doi || null,
        publicationDate: researchInfo.publicationDate || null,
        updatedBy: req.user._id
      });
    }

    // Log Approval History & Audit Log
    await ApprovalHistory.create({
      projectId: project._id,
      action: 'PROJECT_SUBMITTED',
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      message: `Project ${project.projectId} submitted for Supervisor Review.`
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PROJECT_SUBMITTED',
      entityType: 'PROJECT',
      entityId: project.projectId,
      metadata: { version: 1, title }
    });

    // Send Notification to Supervisor
    await sendNotification({
      recipientId: supervisor._id,
      recipientEmail: supervisor.email,
      projectId: project._id,
      type: 'PROJECT_ASSIGNED_FOR_REVIEW',
      title: 'New Project Submission Awaiting Review',
      message: `Student ${req.user.name} submitted project ${project.projectId} ("${project.title}") for your review.`
    });

    return res.json({ success: true, project, version: versionDoc });
  } catch (err) {
    console.error('[ProjectRoutes] Submission Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/projects/:id/resubmit
 * Student resubmission creating a new version (v2, v3) after rejection
 */
router.post('/:id/resubmit', authenticate, requireRole(['STUDENT']), async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      studentId: req.user._id,
      status: { $in: ['REJECTED_BY_SUPERVISOR', 'REJECTED_BY_COORDINATOR'] }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not eligible for resubmission.' });
    }

    const { title, abstract, keywords, technology, domain, files, researchInfo } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ success: false, message: 'Resubmitted project documents are required.' });
    }

    const uploadedDocTypes = files.map(f => f.documentType);
    const missingDocs = MANDATORY_DOCS.filter(docType => !uploadedDocTypes.includes(docType));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Resubmission Error: Missing mandatory document(s): ${missingDocs.join(', ')}.`
      });
    }

    const newVersionNumber = project.currentVersion + 1;

    // Create new Version Document
    const versionDoc = await ProjectVersion.create({
      projectId: project._id,
      versionNumber: newVersionNumber,
      snapshot: { title, abstract, keywords, technology, domain },
      submittedBy: req.user._id
    });

    // Save File records for new version
    for (const f of files) {
      await ProjectFile.create({
        projectId: project._id,
        versionId: versionDoc._id,
        documentType: f.documentType,
        originalName: f.originalName,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
        filePath: f.tempPath
      });
    }

    // Atomic update status back to SUPERVISOR_REVIEW
    project.title = title || project.title;
    project.abstract = abstract || project.abstract;
    project.keywords = keywords || project.keywords;
    project.technology = technology || project.technology;
    project.domain = domain || project.domain;
    project.status = 'SUPERVISOR_REVIEW';
    project.currentVersion = newVersionNumber;
    await project.save();

    // Update Research Info if provided
    if (researchInfo) {
      await ResearchInfo.findOneAndUpdate(
        { projectId: project._id },
        { ...researchInfo, updatedBy: req.user._id },
        { upsert: true }
      );
    }

    await ApprovalHistory.create({
      projectId: project._id,
      action: 'PROJECT_RESUBMITTED',
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      message: `Project ${project.projectId} resubmitted (Version v${newVersionNumber}) for review.`
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PROJECT_RESUBMITTED',
      entityType: 'PROJECT',
      entityId: project.projectId,
      metadata: { version: newVersionNumber }
    });

    // Notify Supervisor
    const supervisor = await User.findById(project.supervisorId);
    if (supervisor) {
      await sendNotification({
        recipientId: supervisor._id,
        recipientEmail: supervisor.email,
        projectId: project._id,
        type: 'PROJECT_RESUBMITTED',
        title: 'Project Resubmitted for Review',
        message: `Student ${req.user.name} has resubmitted project ${project.projectId} (Version v${newVersionNumber}) for review.`
      });
    }

    return res.json({ success: true, project, version: versionDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/projects/:id/supervisor-review
 * Supervisor Approve / Reject with single atomic findOneAndUpdate & mandatory rejection reason validation
 */
router.post('/:id/supervisor-review', authenticate, requireRole(['SUPERVISOR']), async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // action = 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'APPROVE' or 'REJECT'." });
    }

    if (action === 'REJECT' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory on the backend.' });
    }

    const targetStatus = action === 'APPROVE' ? 'COORDINATOR_REVIEW' : 'REJECTED_BY_SUPERVISOR';

    // Atomic conditional update matching project, assigned supervisor, and expected state
    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ supervisorId: req.user._id }, { coSupervisorId: req.user._id }],
        status: 'SUPERVISOR_REVIEW'
      },
      {
        $set: {
          status: targetStatus,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Project status was modified concurrently or you are not the assigned supervisor.'
      });
    }

    // Save Review Record
    const review = await Review.create({
      projectId: updatedProject._id,
      versionId: (await ProjectVersion.findOne({ projectId: updatedProject._id }).sort({ versionNumber: -1 }))._id,
      versionNumber: updatedProject.currentVersion,
      reviewerId: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: req.user.role,
      decision: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      rejectionReason: action === 'REJECT' ? rejectionReason.trim() : null
    });

    await ApprovalHistory.create({
      projectId: updatedProject._id,
      action: action === 'APPROVE' ? 'SUPERVISOR_APPROVED' : 'SUPERVISOR_REJECTED',
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      message: action === 'APPROVE'
        ? `Supervisor ${req.user.name} approved the project. Transferred to Coordinator.`
        : `Supervisor ${req.user.name} rejected the project. Reason: ${rejectionReason}`
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: action === 'APPROVE' ? 'SUPERVISOR_APPROVED' : 'SUPERVISOR_REJECTED',
      entityType: 'PROJECT',
      entityId: updatedProject.projectId,
      metadata: { reason: rejectionReason }
    });

    // Send Notifications
    if (action === 'APPROVE') {
      const coordinator = await User.findById(updatedProject.coordinatorId);
      if (coordinator) {
        await sendNotification({
          recipientId: coordinator._id,
          recipientEmail: coordinator.email,
          projectId: updatedProject._id,
          type: 'COORDINATOR_EVALUATION_AWAITING',
          title: 'Project Awaiting Coordinator Evaluation',
          message: `Project ${updatedProject.projectId} ("${updatedProject.title}") passed Supervisor review and is awaiting your evaluation.`
        });
      }
    } else {
      await sendNotification({
        recipientId: updatedProject.studentId,
        recipientEmail: updatedProject.email,
        projectId: updatedProject._id,
        type: 'SUPERVISOR_REJECTED',
        title: 'Project Submission Rejected by Supervisor',
        message: `Your project ${updatedProject.projectId} was rejected by Supervisor ${req.user.name}.\nReason: ${rejectionReason}`
      });
    }

    return res.json({ success: true, project: updatedProject, review });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/projects/:id/coordinator-review
 * Coordinator Approve / Reject with single atomic findOneAndUpdate & mandatory rejection reason validation
 */
router.post('/:id/coordinator-review', authenticate, requireRole(['COORDINATOR']), async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'APPROVE' or 'REJECT'." });
    }

    if (action === 'REJECT' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory on the backend.' });
    }

    const targetStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED_BY_COORDINATOR';

    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        coordinatorId: req.user._id,
        status: 'COORDINATOR_REVIEW'
      },
      {
        $set: {
          status: targetStatus,
          approvedAt: action === 'APPROVE' ? new Date() : null,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Project status was modified concurrently or you are not the assigned coordinator.'
      });
    }

    const review = await Review.create({
      projectId: updatedProject._id,
      versionId: (await ProjectVersion.findOne({ projectId: updatedProject._id }).sort({ versionNumber: -1 }))._id,
      versionNumber: updatedProject.currentVersion,
      reviewerId: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: req.user.role,
      decision: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      rejectionReason: action === 'REJECT' ? rejectionReason.trim() : null
    });

    await ApprovalHistory.create({
      projectId: updatedProject._id,
      action: action === 'APPROVE' ? 'COORDINATOR_APPROVED' : 'COORDINATOR_REJECTED',
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      message: action === 'APPROVE'
        ? `Coordinator ${req.user.name} granted final approval.`
        : `Coordinator ${req.user.name} rejected the project. Reason: ${rejectionReason}`
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: action === 'APPROVE' ? 'COORDINATOR_APPROVED' : 'COORDINATOR_REJECTED',
      entityType: 'PROJECT',
      entityId: updatedProject.projectId,
      metadata: { reason: rejectionReason }
    });

    if (action === 'APPROVE') {
      // Trigger Cloudinary Automation asynchronously
      processApprovedProjectCloudinaryAutomation(updatedProject._id, req.user);
    } else {
      await sendNotification({
        recipientId: updatedProject.studentId,
        recipientEmail: updatedProject.email,
        projectId: updatedProject._id,
        type: 'COORDINATOR_REJECTED',
        title: 'Project Submission Rejected by Coordinator',
        message: `Your project ${updatedProject.projectId} was rejected by Coordinator ${req.user.name}.\nReason: ${rejectionReason}`
      });
    }

    return res.json({ success: true, project: updatedProject, review });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/v1/projects/:id/research-info
 * Updates patent or publication research information
 */
router.put('/:id/research-info', authenticate, async (req, res) => {
  try {
    const research = await ResearchInfo.findOneAndUpdate(
      { projectId: req.params.id },
      { ...req.body, updatedBy: req.user._id },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RESEARCH_INFO_UPDATED',
      entityType: 'PROJECT',
      entityId: req.params.id
    });

    return res.json({ success: true, researchInfo: research });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
