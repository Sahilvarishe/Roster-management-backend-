import express from 'express';
import {
  getAvailabilityCalendar,
  configureAvailability,
  getAvailabilityRecords,
  getWeeklyOffs,
  updateWeeklyOff,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
} from '../controllers/availabilityController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

// A. Employee Availability
router.get('/calendar', getAvailabilityCalendar);
router.post('/configure', configureAvailability);
router.get('/records', getAvailabilityRecords);

// B. Weekly Off Management
router.get('/weekly-offs', getWeeklyOffs);
router.put('/weekly-offs/:employeeId', authorizeRoles('admin', 'operations_manager'), updateWeeklyOff);

// C. Public Holidays
router.get('/holidays', getHolidays);
router.post('/holidays', authorizeRoles('admin', 'operations_manager'), createHoliday);
router.put('/holidays/:id', authorizeRoles('admin', 'operations_manager'), updateHoliday);
router.delete('/holidays/:id', authorizeRoles('admin', 'operations_manager'), deleteHoliday);

export default router;
