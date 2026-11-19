import express from 'express';
import {
  getRoster,
  generateRoster,
  validateRosterAction,
  publishRosterAction,
  updateRosterEntry,
  exportRosterCSV,
  getCoverageSummaryEndpoint
} from '../controllers/rosterController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateUser, getRoster);
router.get('/current', authenticateUser, getRoster);
router.get('/export-csv', authenticateUser, exportRosterCSV);
router.get('/coverage-summary', authenticateUser, getCoverageSummaryEndpoint);
router.post('/validate', authenticateUser, validateRosterAction);

// Roster Generation, Publishing, and Manual Editing restricted to Admin & Operations Manager
router.post('/generate', authenticateUser, authorizeRoles('admin', 'operations_manager'), generateRoster);
router.patch('/publish', authenticateUser, authorizeRoles('admin', 'operations_manager'), publishRosterAction);
router.patch('/entry', authenticateUser, authorizeRoles('admin', 'operations_manager'), updateRosterEntry);

export default router;
