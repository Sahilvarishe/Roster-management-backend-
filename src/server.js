import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import rosterRoutes from './routes/rosterRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import processRoutes from './routes/processRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import podRoutes from './routes/podRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import conflictRoutes from './routes/conflictRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // Allow all origins while supporting credentials
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// Authentication & User Management Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);

// Core Management Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/pods', podRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/conflicts', conflictRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Operations & Roster Management API',
    database: getDBStatus()
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Operations Management System Backend Running',
    endpoints: {
      dashboardStats: '/api/dashboard/stats',
      coverageAnalytics: '/api/dashboard/coverage',
      upcomingEvents: '/api/dashboard/upcoming-events',
      actions: '/api/actions'
    }
  });
});

// Start Server
const startServer = async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Operations Management Server listening on port ${PORT}`);
    console.log(`📡 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`======================================================\n`);
  });
};

startServer();

export { app };
