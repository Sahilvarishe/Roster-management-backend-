import express from 'express';
import {
  submitLeaveRequest,
  getMyLeaveRequests,
  getPodLeaveRequests,
  getAllLeaveRequests,
  reviewLeaveRequest,
  cancelLeaveRequest
} from '../controllers/leaveController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// Any authenticated user can submit leave or get their own
router.post('/request', submitLeaveRequest);
router.post('/apply', submitLeaveRequest);
router.get('/my', getMyLeaveRequests);
router.get('/my-requests', getMyLeaveRequests);

// Pod Lead or higher can view their pod's leave requests
router.get('/pod', authorizeRoles('admin', 'operations_manager', 'pod_lead'), getPodLeaveRequests);
router.get('/pod-requests', authorizeRoles('admin', 'operations_manager', 'pod_lead'), getPodLeaveRequests);

// Operations Manager or Admin can view company-wide leaves
router.get('/', authorizeRoles('admin', 'operations_manager'), getAllLeaveRequests);

// Review (approve/reject)
router.patch('/:id/review', authorizeRoles('admin', 'operations_manager', 'pod_lead'), reviewLeaveRequest);

// Cancel (supports both PATCH /:id/cancel and DELETE /:id)
router.patch('/:id/cancel', cancelLeaveRequest);
router.delete('/:id', cancelLeaveRequest);

export default router;
