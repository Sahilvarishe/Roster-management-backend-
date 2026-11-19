import express from 'express';
import {
  generateRoster,
  addEmployee,
  addBrand,
  manageAvailability
} from '../controllers/actionController.js';

const router = express.Router();

router.post('/generate-roster', generateRoster);
router.post('/add-employee', addEmployee);
router.post('/add-brand', addBrand);
router.post('/manage-availability', manageAvailability);

export default router;
