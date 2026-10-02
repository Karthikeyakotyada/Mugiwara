const mongoose = require('mongoose');

const projectFileSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    documentType: {
      type: String,
      enum: [
        'FINAL_REPORT',
        'PRESENTATION',
        'APPROVAL_CERTIFICATE',
        'PLAGIARISM_REPORT',
        'POSTER',
        'SOURCE_CODE',
        'GITHUB_LINK',
        'DEMO_VIDEO'
      ],
      required: true
    },
    originalName: { type: String, required: true },
    finalName: { type: String, default: null },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    cloudinaryPublicId: { type: String, default: null },
    cloudinaryUrl: { type: String, default: null },
    isUploadedToCloudinary: { type: Boolean, default: false }
  },
  { timestamps: true }
);

projectFileSchema.index({ projectId: 1, versionId: 1, documentType: 1 }, { unique: true });

module.exports = mongoose.model('ProjectFile', projectFileSchema);
