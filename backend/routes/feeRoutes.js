
import express from 'express';
import { payFees } from '../controllers/feeController.js';

const router = express.Router();

router.post('/pay', payFees);

export default router;