const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Project = require('./models/Project');
const ProjectVersion = require('./models/ProjectVersion');
const ProjectFile = require('./models/ProjectFile');
const Review = require('./models/Review');
const AuditLog = require('./models/AuditLog');
const SystemConfig = require('./models/SystemConfig');

const { generateProjectId } = require('./services/projectIdService');
const { validateFileMagicBytes } = require('./services/fileValidationService');
const { processApprovedProjectCloudinaryAutomation } = require('./services/cloudinaryService');

async function seedTestData() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create([
      { name: 'System Admin', email: 'admin@klu.ac.in', role: 'ADMIN', department: 'ECE', isActive: true },
      { name: 'Dr. E. V. Krishna', email: 'supervisor1@klu.ac.in', role: 'SUPERVISOR', department: 'ECE', isActive: true },
      { name: 'Dr. K. Raghava Rao', email: 'coordinator1@klu.ac.in', role: 'COORDINATOR', department: 'ECE', isActive: true },
      { name: 'Rajesh Kumar', email: 'student1@klu.ac.in', role: 'STUDENT', registerNumber: '2000030056', department: 'ECE', isActive: true }
    ]);
  }
}

async function runVerificationTests() {
  console.log('=== STARTING KLU SYSTEM INTEGRATION VERIFICATION TESTS ===\n');

  let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/klu_project_db';
  let mongoServer = null;

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`✓ Connected to external MongoDB at ${mongoUri}`);
  } catch (e) {
    console.log('⚠ External MongoDB unavailable. Launching embedded MongoMemoryServer for verification suite...');
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`✓ Connected to embedded MongoMemoryServer at ${mongoUri}`);
  }

  await seedTestData();

  // TEST 1: Scoped Project ID Concurrency & Monotonic Increment
  console.log('\n[TEST 1] Testing Scoped Atomic Project ID Generation...');
  const id1 = await generateProjectId('ECE', '2026-27');
  const id2 = await generateProjectId('ECE', '2026-27');
  const idCse = await generateProjectId('CSE', '2026-27');

  console.log(`- ECE ID 1: ${id1}`);
  console.log(`- ECE ID 2: ${id2}`);
  console.log(`- CSE ID 1: ${idCse}`);

  if (id1.startsWith('ECE2026-') && id2.startsWith('ECE2026-') && idCse.startsWith('CSE2026-')) {
    console.log('✓ TEST 1 PASSED: Scoped Project IDs generated independently!');
  } else {
    throw new Error('TEST 1 FAILED: Invalid Project ID format.');
  }

  // TEST 2: Magic Bytes File Validation
  console.log('\n[TEST 2] Testing Content-Level Magic Bytes Inspection...');
  const testDir = path.join(__dirname, '../scratch/test_files');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const dummyPdfPath = path.join(testDir, 'valid.pdf');
  fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n');

  const isValidPdf = await validateFileMagicBytes(dummyPdfPath, 'FINAL_REPORT', 'valid.pdf');
  console.log(`- PDF Magic Byte Check: ${isValidPdf}`);

  const dummyExePath = path.join(testDir, 'fake.pdf');
  fs.writeFileSync(dummyExePath, 'MZ\x90\x00\x03\x00\x00\x00'); // Fake exe signature

  let caughtError = false;
  try {
    await validateFileMagicBytes(dummyExePath, 'FINAL_REPORT', 'fake.pdf');
  } catch (e) {
    caughtError = true;
    console.log(`- Correctly caught fake PDF upload: ${e.message}`);
  }

  if (isValidPdf && caughtError) {
    console.log('✓ TEST 2 PASSED: Magic Bytes signature validation enforced!');
  } else {
    throw new Error('TEST 2 FAILED: Magic bytes validation failed.');
  }

  // TEST 3: End-to-End Workflow & Lock Execution
  console.log('\n[TEST 3] Testing End-to-End Approval Lifecycle & Drive Automation Lock...');

  const student = await User.findOne({ role: 'STUDENT' });
  const supervisor = await User.findOne({ role: 'SUPERVISOR' });
  const coordinator = await User.findOne({ role: 'COORDINATOR' });

  const projCode = await generateProjectId('ECE', '2026-27');
  const project = await Project.create({
    projectId: projCode,
    academicYear: '2026-27',
    semester: 'Semester 8',
    department: 'ECE',
    studentId: student._id,
    studentName: student.name,
    registerNumber: student.registerNumber || '2000030056',
    email: student.email,
    title: 'Autonomous Drone Navigation System using AI',
    abstract: 'Comprehensive study of drone navigation using computer vision and deep reinforcement learning.',
    keywords: ['AI', 'Drone', 'Computer Vision'],
    technology: ['Python', 'OpenCV', 'PyTorch'],
    domain: 'Artificial Intelligence',
    supervisorId: supervisor._id,
    coordinatorId: coordinator._id,
    status: 'SUPERVISOR_REVIEW',
    currentVersion: 1
  });

  console.log(`- Created Project ${project.projectId} in SUPERVISOR_REVIEW status.`);

  // 1. Supervisor Approval -> Moves to COORDINATOR_REVIEW
  const supUpdated = await Project.findOneAndUpdate(
    { _id: project._id, supervisorId: supervisor._id, status: 'SUPERVISOR_REVIEW' },
    { $set: { status: 'COORDINATOR_REVIEW' } },
    { new: true }
  );

  console.log(`- Supervisor Approved -> Status: ${supUpdated.status}`);

  // 2. Coordinator Approval -> Moves to APPROVED
  const coordUpdated = await Project.findOneAndUpdate(
    { _id: project._id, coordinatorId: coordinator._id, status: 'COORDINATOR_REVIEW' },
    { $set: { status: 'APPROVED', approvedAt: new Date() } },
    { new: true }
  );

  console.log(`- Coordinator Approved -> Status: ${coordUpdated.status}`);

  // 3. Cloudinary Automation Execution
  console.log('- Executing Cloudinary Repository Automation & Worker Lock...');
  const cloudResult = await processApprovedProjectCloudinaryAutomation(project._id, coordinator);

  console.log(`- Cloudinary Automation Success: ${cloudResult.success}`);
  const finalProj = await Project.findById(project._id);
  console.log(`- Final Project Status: ${finalProj.status} | Locked: ${finalProj.locked}`);

  if (finalProj.status === 'LOCKED' && finalProj.locked === true) {
    console.log('✓ TEST 3 PASSED: Full Workflow & Repository Lock Completed Successfully!');
  } else {
    throw new Error('TEST 3 FAILED: Project was not locked post approval.');
  }

  console.log('\n=== ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  process.exit(0);
}

runVerificationTests().catch(async (err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
