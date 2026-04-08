import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import { 
  getStudents, 
  addStudent, 
  getStudentById, 
  deleteStudent, 
  addRemark, 
  addTestScore 
} from '../controllers/studentController.js';
const router = express.Router();

router.route('/')
  .get(protect, adminOnly, getStudents)
  .post(protect, adminOnly, addStudent);

// Single Student Routes
router.route('/:id')
  .get(protect, getStudentById)  // students need to view their own profile
  .delete(protect, adminOnly, deleteStudent);

router.post('/:id/remarks', protect, adminOnly, addRemark);
router.post('/:id/scores', protect, adminOnly, addTestScore);

export default router;