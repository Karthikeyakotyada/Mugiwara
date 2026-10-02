const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Project = require('../models/Project');
const ProjectFile = require('../models/ProjectFile');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('./emailService');

const LOCAL_REPO_PATH = path.join(__dirname, '../../scratch/cloudinary_repository');

if (!fs.existsSync(LOCAL_REPO_PATH)) {
  fs.mkdirSync(LOCAL_REPO_PATH, { recursive: true });
}

// Get Cloudinary client status
function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null; // Local disk fallback mode
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    return cloudinary;
  } catch (err) {
    console.warn('[CloudinaryService] Failed to initialize Cloudinary client, using local repository fallback:', err.message);
    return null;
  }
}

/**
 * Executes repository automation for an APPROVED project using Cloudinary.
 * Implements crash-safe idempotency via atomic worker lock (automationLockId).
 */
async function processApprovedProjectCloudinaryAutomation(projectId, actorUser) {
  const workerLockId = crypto.randomUUID();
  const lockTTLMs = 10 * 60 * 1000; // 10 minutes

  // 1. Atomically claim lock
  const claimedProject = await Project.findOneAndUpdate(
    {
      _id: projectId,
      status: { $in: ['APPROVED', 'AUTOMATION_FAILED'] },
      locked: false,
      $or: [
        { automationStatus: 'IDLE', processingLockUntil: null },
        { automationStatus: 'FAILED' },
        { processingLockUntil: { $lt: new Date() } } // Reclaim expired lock
      ]
    },
    {
      $set: {
        automationStatus: 'PROCESSING',
        automationLockId: workerLockId,
        processingLockUntil: new Date(Date.now() + lockTTLMs)
      }
    },
    { new: true }
  ).populate('studentId supervisorId coordinatorId');

  if (!claimedProject) {
    console.log(`[CloudinaryService] Project ${projectId} is already locked or currently being processed by another worker.`);
    return { success: false, reason: 'LOCKED_OR_PROCESSING' };
  }

  // Periodic heartbeat interval
  const heartbeatTimer = setInterval(async () => {
    try {
      await Project.updateOne(
        { _id: projectId, automationLockId: workerLockId },
        { $set: { processingLockUntil: new Date(Date.now() + lockTTLMs) } }
      );
    } catch (e) {
      console.error('[CloudinaryService] Heartbeat error:', e.message);
    }
  }, 2 * 60 * 1000); // Renewal every 2 minutes

  const cloudClient = getCloudinaryClient();

  try {
    const projectFiles = await ProjectFile.find({
      projectId: claimedProject._id
    });

    const safeYear = (claimedProject.academicYear || '2026-27').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeSem = (claimedProject.semester || 'Semester 1').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeStudentName = claimedProject.studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeProjFolder = `${claimedProject.projectId}_${safeStudentName}`;
    const cloudinaryFolder = `klu_repository/${safeYear}/${safeSem}/${safeProjFolder}`;

    if (cloudClient) {
      // Cloudinary upload
      for (const fileDoc of projectFiles) {
        if (!fileDoc.filePath || !fs.existsSync(fileDoc.filePath)) continue;

        const safeRegNo = (claimedProject.registerNumber || 'REG000').replace(/[^a-zA-Z0-9]/g, '');
        const ext = path.extname(fileDoc.originalName) || '.pdf';
        const finalName = `${claimedProject.projectId}_${safeRegNo}_${safeStudentName}_${fileDoc.documentType}${ext}`;
        const publicId = `${claimedProject.projectId}_${fileDoc.documentType}`;

        let cPublicId = fileDoc.cloudinaryPublicId;
        let cUrl = fileDoc.cloudinaryUrl;

        if (!cPublicId) {
          const uploadRes = await cloudClient.uploader.upload(fileDoc.filePath, {
            folder: cloudinaryFolder,
            public_id: publicId,
            resource_type: 'auto',
            overwrite: true
          });

          cPublicId = uploadRes.public_id;
          cUrl = uploadRes.secure_url;
        }

        fileDoc.finalName = finalName;
        fileDoc.cloudinaryPublicId = cPublicId;
        fileDoc.cloudinaryUrl = cUrl;
        fileDoc.isUploadedToCloudinary = true;
        await fileDoc.save();
      }
    } else {
      // Local Disk Repository Fallback Mode
      const targetDir = path.join(LOCAL_REPO_PATH, safeYear, safeSem, safeProjFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const fileDoc of projectFiles) {
        if (!fileDoc.filePath || !fs.existsSync(fileDoc.filePath)) continue;

        const safeRegNo = (claimedProject.registerNumber || 'REG000').replace(/[^a-zA-Z0-9]/g, '');
        const ext = path.extname(fileDoc.originalName) || '.pdf';
        const finalName = `${claimedProject.projectId}_${safeRegNo}_${safeStudentName}_${fileDoc.documentType}${ext}`;
        const destPath = path.join(targetDir, finalName);

        fs.copyFileSync(fileDoc.filePath, destPath);

        const fileNameOnly = path.basename(fileDoc.filePath);
        fileDoc.finalName = finalName;
        fileDoc.cloudinaryPublicId = `local_cloudinary_${fileDoc._id}`;
        fileDoc.cloudinaryUrl = `/uploads/${fileNameOnly}`;
        fileDoc.isUploadedToCloudinary = true;
        await fileDoc.save();
      }
    }

    clearInterval(heartbeatTimer);

    // Atomically complete & LOCK project
    const finalLockedProject = await Project.findOneAndUpdate(
      {
        _id: claimedProject._id,
        automationLockId: workerLockId
      },
      {
        $set: {
          status: 'LOCKED',
          locked: true,
          automationStatus: 'COMPLETED',
          automationLockId: null,
          processingLockUntil: null,
          cloudinaryFolder
        }
      },
      { new: true }
    );

    if (!finalLockedProject) {
      console.warn(`[CloudinaryService] Lease lost during completion for ${claimedProject.projectId}`);
      return { success: false, reason: 'LEASE_LOST' };
    }

    // Audit log entry
    await AuditLog.create({
      actorId: actorUser ? actorUser._id : null,
      actorName: actorUser ? actorUser.name : 'System Cloudinary Worker',
      actorRole: actorUser ? actorUser.role : 'SYSTEM',
      action: 'CLOUDINARY_REPOSITORY_CREATED',
      entityType: 'PROJECT',
      entityId: claimedProject.projectId,
      metadata: {
        cloudinaryFolder,
        filesCount: projectFiles.length
      }
    });

    // Send Notification
    try {
      await sendNotification({
        recipientId: claimedProject.studentId,
        projectId: claimedProject._id,
        type: 'REPOSITORY_COMPLETED',
        title: 'Project Repository Created & Locked',
        message: `Your project ${claimedProject.projectId} ("${claimedProject.title}") has been fully approved and synchronized to the Cloudinary repository. The project is now read-only.`
      });
    } catch (eErr) {
      console.error('[CloudinaryService] Non-blocking email notification failure:', eErr.message);
    }

    return { success: true, project: finalLockedProject };
  } catch (err) {
    clearInterval(heartbeatTimer);
    console.error(`[CloudinaryService] Cloudinary automation failed for ${claimedProject.projectId}:`, err.message);

    // Atomically transition to AUTOMATION_FAILED
    await Project.updateOne(
      { _id: claimedProject._id, automationLockId: workerLockId },
      {
        $set: {
          status: 'AUTOMATION_FAILED',
          locked: false,
          automationStatus: 'FAILED',
          automationLockId: null,
          processingLockUntil: null
        }
      }
    );

    await AuditLog.create({
      actorId: actorUser ? actorUser._id : null,
      actorName: actorUser ? actorUser.name : 'System Cloudinary Worker',
      actorRole: actorUser ? actorUser.role : 'SYSTEM',
      action: 'CLOUDINARY_AUTOMATION_FAILED',
      entityType: 'PROJECT',
      entityId: claimedProject.projectId,
      metadata: { error: err.message }
    });

    return { success: false, error: err.message };
  }
}

/**
 * Uploads an individual file (PDF or document) to Cloudinary immediately upon upload/submission
 */
async function uploadFileToCloudinary(filePath, { folder = 'klu_repository/submissions', publicId = null, originalName = '' } = {}) {
  const cloudClient = getCloudinaryClient();
  if (!cloudClient) {
    return { success: false, reason: 'CLOUDINARY_NOT_CONFIGURED' };
  }

  const ext = (path.extname(originalName || filePath) || '').toLowerCase();
  const isPdf = ext === '.pdf';
  const primaryType = isPdf ? 'image' : (['.zip', '.tar', '.7z', '.gz'].includes(ext) ? 'raw' : 'auto');

  try {
    const uploadOptions = {
      folder,
      resource_type: primaryType,
      overwrite: true
    };
    if (publicId) uploadOptions.public_id = publicId;

    let res;
    try {
      res = await cloudClient.uploader.upload(filePath, uploadOptions);
    } catch (firstErr) {
      if (primaryType !== 'raw') {
        uploadOptions.resource_type = 'raw';
        res = await cloudClient.uploader.upload(filePath, uploadOptions);
      } else {
        throw firstErr;
      }
    }

    return {
      success: true,
      publicId: res.public_id,
      secureUrl: res.secure_url,
      resourceType: res.resource_type,
      format: res.format || (isPdf ? 'pdf' : ext.replace('.', ''))
    };
  } catch (err) {
    console.error('[CloudinaryService] File upload error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generates an authenticated signed download/preview URL for Cloudinary assets
 */
function getSecureDownloadUrl(publicId, format = 'pdf', resourceType = 'image') {
  const cloudClient = getCloudinaryClient();
  if (!cloudClient || !publicId) return null;

  try {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, '');
    const cleanFormat = (format || 'pdf').replace(/^\./, '');
    return cloudClient.utils.private_download_url(cleanPublicId, cleanFormat, {
      resource_type: resourceType || (cleanFormat === 'pdf' ? 'image' : 'raw'),
      type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + 7200 // 2 hours validity
    });
  } catch (err) {
    console.warn('[CloudinaryService] Failed to generate secure URL:', err.message);
    return null;
  }
}

module.exports = {
  processApprovedProjectCloudinaryAutomation,
  getCloudinaryClient,
  uploadFileToCloudinary,
  getSecureDownloadUrl
};

