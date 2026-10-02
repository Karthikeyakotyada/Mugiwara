const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true
    },
    academicYear: { type: String, required: true, trim: true, index: true },
    semester: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, trim: true, uppercase: true, index: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentName: { type: String, required: true, trim: true },
    registerNumber: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, index: 'text' },
    abstract: { type: String, required: true, trim: true, index: 'text' },
    keywords: [{ type: String, trim: true, index: true }],
    technology: [{ type: String, trim: true, index: true }],
    domain: { type: String, required: true, trim: true, index: true },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    coSupervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUPERVISOR_REVIEW',
        'REJECTED_BY_SUPERVISOR',
        'COORDINATOR_REVIEW',
        'REJECTED_BY_COORDINATOR',
        'APPROVED',
        'AUTOMATION_FAILED',
        'LOCKED'
      ],
      default: 'DRAFT',
      index: true
    },
    currentVersion: { type: Number, default: 1 },
    cloudinaryFolder: { type: String, default: null },
    locked: { type: Boolean, default: false, index: true },
    automationStatus: {
      type: String,
      enum: ['IDLE', 'PROCESSING', 'FAILED', 'COMPLETED'],
      default: 'IDLE',
      index: true
    },
    automationLockId: { type: String, default: null },
    processingLockUntil: { type: Date, default: null },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

projectSchema.index({ academicYear: 1, semester: 1 });
projectSchema.index({ supervisorId: 1, status: 1 });
projectSchema.index({ coordinatorId: 1, status: 1 });
projectSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
