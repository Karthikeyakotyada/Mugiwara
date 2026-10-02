const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dns = require('dns');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

// Ensure reliable SRV resolution on Windows for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[Server] DNS custom servers warning:', dnsErr.message);
}

const User = require('./models/User');
const SystemConfig = require('./models/SystemConfig');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const searchRoutes = require('./routes/searchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5177',
  'http://localhost:5173',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static folder for temp uploads
app.use('/uploads', express.static(path.join(__dirname, '../scratch/tmp_uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'KLU Academic Project Management & Repository System',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Seeding initial institutional accounts...');
      await User.create([
        {
          name: 'System Admin',
          email: 'admin@klu.ac.in',
          role: 'ADMIN',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Dr. E. V. Krishna (HOD/Supervisor)',
          email: 'supervisor1@klu.ac.in',
          role: 'SUPERVISOR',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Dr. P. Satyanarayana (Supervisor)',
          email: 'supervisor2@klu.ac.in',
          role: 'SUPERVISOR',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Dr. K. Raghava Rao (Coordinator 1)',
          email: 'coordinator1@klu.ac.in',
          role: 'COORDINATOR',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Dr. M. Suman (Coordinator 2)',
          email: 'coordinator2@klu.ac.in',
          role: 'COORDINATOR',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Dr. V. S. V. Prabhakar (Coordinator 3)',
          email: 'coordinator3@klu.ac.in',
          role: 'COORDINATOR',
          department: 'CSE',
          isActive: true
        },
        {
          name: 'Dr. A. V. Praveen Kumar (Coordinator 4)',
          email: 'coordinator4@klu.ac.in',
          role: 'COORDINATOR',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Rajesh Kumar (Student)',
          email: 'student1@klu.ac.in',
          role: 'STUDENT',
          registerNumber: '2000030056',
          department: 'ECE',
          isActive: true
        },
        {
          name: 'Ananya Sharma (Student)',
          email: 'student2@klu.ac.in',
          role: 'STUDENT',
          registerNumber: '2000030089',
          department: 'CSE',
          isActive: true
        },
        {
          name: 'Institutional User (Student)',
          email: process.env.SMTP_USER || '9924008032@klu.ac.in',
          role: 'STUDENT',
          registerNumber: (process.env.SMTP_USER || '9924008032').split('@')[0],
          department: 'ECE',
          isActive: true
        }
      ]);
      console.log('[Seed] Default users seeded successfully!');
    }

    const configCount = await SystemConfig.countDocuments();
    if (configCount === 0) {
      await SystemConfig.create([
        { key: 'MAX_UPLOAD_SIZE_MB', value: 50, description: 'Maximum file upload size limit in MB' },
        { key: 'ACADEMIC_YEARS', value: ['2025-26', '2026-27', '2027-28'], description: 'Active academic years' },
        { key: 'SEMESTERS', value: ['Semester 1', 'Semester 2', 'Semester 7', 'Semester 8'], description: 'Active semesters' },
        { key: 'DEPARTMENTS', value: ['ECE', 'CSE', 'EEE', 'MECH', 'CIVIL', 'AI&DS'], description: 'Academic departments' },
        { key: 'FILE_NAMING_TEMPLATE', value: '{PROJECT_ID}_{REGISTER_NO}_{STUDENT_NAME}_{DOCUMENT_TYPE}', description: 'Repository file naming pattern' }
      ]);
    }
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
}

async function startServer() {
  let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/klu_project_db';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log(`[Database] Connected successfully to external MongoDB at ${mongoUri}`);
  } catch (err) {
    console.warn(`[Database] External MongoDB connection error (${err.message}). Launching embedded MongoMemoryServer...`);
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`[Database] Connected to embedded MongoMemoryServer at ${mongoUri}`);
  }

  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`[Server] KLU Project System Backend running on port ${PORT}`);
  });
}

startServer();
