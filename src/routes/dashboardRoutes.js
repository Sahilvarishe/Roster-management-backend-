import express from 'express';
import {
  getDashboardStats,
  getCoverageAnalytics,
  getUpcomingEvents,
  resolveConflict,
  getPodDashboardStats,
  getEmployeeDashboardStats
} from '../controllers/dashboardController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/coverage', getCoverageAnalytics);
router.get('/upcoming-events', getUpcomingEvents);
router.patch('/conflicts/:id/resolve', resolveConflict);

// Role-specific telemetry routes
router.get('/pod-telemetry', authenticateUser, authorizeRoles('admin', 'operations_manager', 'pod_lead'), getPodDashboardStats);
router.get('/employee-telemetry', authenticateUser, getEmployeeDashboardStats);

export default router;
