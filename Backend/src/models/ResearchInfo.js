const mongoose = require('mongoose');

const researchInfoSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true
    },
    hasPatent: { type: Boolean, default: false, index: true },
    patentStatus: { type: String, default: null },
    patentNumber: { type: String, default: null },
    patentTitle: { type: String, default: null },
    patentDate: { type: Date, default: null },

    hasPublication: { type: Boolean, default: false, index: true },
    publicationStatus: { type: String, default: null },
    paperTitle: { type: String, default: null },
    journalConference: { type: String, default: null },
    doi: { type: String, default: null },
    publicationDate: { type: Date, default: null },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResearchInfo', researchInfoSchema);
