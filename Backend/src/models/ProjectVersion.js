const mongoose = require('mongoose');

const projectVersionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    versionNumber: { type: Number, required: true },
    snapshot: { type: Object, required: true },
    submittedAt: { type: Date, default: Date.now },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

projectVersionSchema.index({ projectId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('ProjectVersion', projectVersionSchema);
