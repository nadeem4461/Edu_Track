import express from 'express';
import { markAttendance ,getStudentAttendance} from '../controllers/attendanceController.js';
const router = express.Router();

router.post('/', markAttendance);
router.get('/:studentId', getStudentAttendance);
export default router;