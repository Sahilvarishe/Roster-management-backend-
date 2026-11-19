import express from 'express';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  createProcess,
  updateProcess,
  toggleProcessStatus,
  deleteProcess
} from '../controllers/brandProcessController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Brands endpoints
router.get('/', authenticateUser, getBrands);
router.get('/:id', authenticateUser, getBrandById);
router.post('/', authenticateUser, authorizeRoles('admin', 'operations_manager'), createBrand);
router.put('/:id', authenticateUser, authorizeRoles('admin', 'operations_manager'), updateBrand);
router.delete('/:id', authenticateUser, authorizeRoles('admin', 'operations_manager'), deleteBrand);

export default router;
