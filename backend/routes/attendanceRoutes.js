import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { markAttendance ,getStudentAttendance,getAllAttendance} from '../controllers/attendanceController.js';
const router = express.Router();

router.post('/', protect, adminOnly, markAttendance);
router.get('/all', protect, adminOnly, getAllAttendance);
router.get('/:studentId', protect, getStudentAttendance);
export default router;