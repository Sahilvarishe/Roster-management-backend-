import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  getEmployeeRoster,
  getEmployeeLeaves
} from '../controllers/employeeController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read routes: Accessible by authenticated users with role filtering
router.get('/', authenticateUser, getEmployees);
router.get('/:id', authenticateUser, getEmployeeById);
router.get('/:id/roster', authenticateUser, getEmployeeRoster);
router.get('/:id/leaves', authenticateUser, getEmployeeLeaves);

// Write routes: Restricted strictly to Admin and Operations Manager
router.post('/', authenticateUser, authorizeRoles('admin', 'operations_manager'), createEmployee);
router.put('/:id', authenticateUser, authorizeRoles('admin', 'operations_manager'), updateEmployee);
router.patch('/:id/status', authenticateUser, authorizeRoles('admin', 'operations_manager'), toggleEmployeeStatus);
router.delete('/:id', authenticateUser, authorizeRoles('admin', 'operations_manager'), deleteEmployee);

export default router;
