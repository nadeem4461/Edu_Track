import express from 'express';
import { studentLogin, adminLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/student', studentLogin);
router.post('/admin', adminLogin);

export default router;