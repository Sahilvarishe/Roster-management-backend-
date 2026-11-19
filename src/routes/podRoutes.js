import express from 'express';
import {
  getPods,
  getPodById,
  createPod,
  updatePod,
  deletePod
} from '../controllers/podController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all pods with enrichment (leads, employee count, brands, coverage status)
router.get('/', authenticateUser, getPods);

// GET pod by ID or name with 6-part details
router.get('/:id', authenticateUser, getPodById);

// POST create new pod (fields: name, lead, employees, description)
router.post('/', authenticateUser, authorizeRoles('admin', 'operations_manager'), createPod);

// PUT update pod
router.put('/:id', authenticateUser, authorizeRoles('admin', 'operations_manager'), updatePod);

// DELETE remove pod
router.delete('/:id', authenticateUser, authorizeRoles('admin', 'operations_manager'), deletePod);

export default router;
