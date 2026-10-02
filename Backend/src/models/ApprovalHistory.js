const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    action: { type: String, required: true },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    message: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApprovalHistory', approvalHistorySchema);
