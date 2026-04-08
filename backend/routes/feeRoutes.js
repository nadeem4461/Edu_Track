import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { payFees } from '../controllers/feeController.js';

const router = express.Router();

router.post('/pay', protect, adminOnly, payFees);

export default router;