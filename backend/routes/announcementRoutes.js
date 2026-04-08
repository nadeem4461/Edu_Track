import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController.js';

const router = express.Router();

router.post('/', protect, adminOnly, createAnnouncement);
router.get('/', protect, getAnnouncements); // students can view announcements

export default router;