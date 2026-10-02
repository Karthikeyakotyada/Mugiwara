const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectVersion',
      required: true
    },
    versionNumber: { type: Number, required: true },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewerName: { type: String, required: true },
    reviewerRole: {
      type: String,
      enum: ['SUPERVISOR', 'COORDINATOR', 'ADMIN'],
      required: true
    },
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED'],
      required: true
    },
    rejectionReason: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
