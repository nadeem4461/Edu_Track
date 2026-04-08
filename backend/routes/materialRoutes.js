import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getMaterials, addMaterial, deleteMaterial } from '../controllers/materialController.js';

const router = express.Router();

router.get('/', protect, getMaterials); // students can view materials
router.post('/', protect, adminOnly, addMaterial);
router.delete('/:id', protect, adminOnly, deleteMaterial);

export default router;