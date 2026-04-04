import express from 'express';

import { addStudent ,getStudents } from '../controllers/studentController.js';

const router = express.Router();

router.route('/').post(addStudent).get(getStudents);

export default router;