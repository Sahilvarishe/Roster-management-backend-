import express from 'express';
import {
  getAssignmentOverview,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../controllers/assignmentController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// GET overview stats
router.get('/overview', getAssignmentOverview);

// GET all assignments with filters & search
router.get('/', getAssignments);

// Mutations restricted to Admin & Operations Manager
router.post('/', authorizeRoles('admin', 'operations_manager'), createAssignment);
router.put('/:id', authorizeRoles('admin', 'operations_manager'), updateAssignment);
router.delete('/:id', authorizeRoles('admin', 'operations_manager'), deleteAssignment);

export default router;
