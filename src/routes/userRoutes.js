import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser
} from '../controllers/userController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user management routes require Admin or Operations Manager
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'operations_manager'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);
router.patch('/:id/status', toggleUserStatus);
router.post('/:id/reset-password', resetUserPassword);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;
