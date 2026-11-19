import express from 'express';
import {
  getConflictStats,
  getConflicts,
  getConflictById,
  resolveConflict,
  revalidateConflicts
} from '../controllers/conflictController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// A. Conflict Statistics
router.get('/stats', getConflictStats);

// B. Conflict Table / List
router.get('/', getConflicts);

// C. Conflict Details
router.get('/:id', getConflictById);

// 1-Click Resolve Conflict
router.post('/:id/resolve', authorizeRoles('admin', 'operations_manager', 'pod_lead'), resolveConflict);

// D. Revalidate Engine
router.post('/revalidate', authorizeRoles('admin', 'operations_manager'), revalidateConflicts);

export default router;
