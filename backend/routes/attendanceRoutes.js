import express from 'express';
import { markAttendance } from '../controllers/attendanceController.js';
const router = express.Router();

router.post('/', markAttendance);
export default router;