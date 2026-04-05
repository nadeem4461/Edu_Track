import express from 'express';

import { addStudent ,getStudents,addRemark } from '../controllers/studentController.js';

const router = express.Router();

router.route('/').post(addStudent).get(getStudents);

router.post('/:id/remarks', addRemark);
export default router;