const Counter = require('../models/Counter');

/**
 * Generates an atomic, monotonically increasing Project ID scoped by Department & Academic Year.
 * Example: ECE + 2026 => ECE2026-001, CSE + 2026 => CSE2026-001
 * Gap-tolerant: Does not reuse numbers if a transaction skips a sequence.
 */
async function generateProjectId(department, academicYear) {
  const deptCode = (department || 'ECE').toUpperCase().trim();
  // Extract 4-digit year from academicYear like '2026-27' or '2026'
  const yearMatch = (academicYear || '2026').match(/\d{4}/);
  const yearCode = yearMatch ? yearMatch[0] : '2026';

  const counterKey = `${deptCode}_${yearCode}`;

  // Atomic findOneAndUpdate increment on Counter document
  const counterDoc = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counterDoc.seq).padStart(3, '0');
  const projectId = `${deptCode}${yearCode}-${paddedSeq}`;

  return projectId;
}

module.exports = {
  generateProjectId
};
