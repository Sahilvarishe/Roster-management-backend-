import express from 'express';
import {
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateUser, changePassword);

export default router;
