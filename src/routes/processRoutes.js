import express from 'express';
import {
  getProcesses,
  createProcess,
  updateProcess,
  toggleProcessStatus,
  deleteProcess
} from '../controllers/brandProcessController.js';

const router = express.Router();

router.get('/', getProcesses);
router.post('/', createProcess);
router.put('/:id', updateProcess);
router.patch('/:id/status', toggleProcessStatus);
router.delete('/:id', deleteProcess);

export default router;
