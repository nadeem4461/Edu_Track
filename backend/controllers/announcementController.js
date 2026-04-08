import Announcement from '../models/Announcement.js';

// @desc    Create a new announcement
// @route   POST /api/announcements
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetBatch } = req.body;
    
    const newAnnouncement = await Announcement.create({
      title,
      message,
      targetBatch: targetBatch || 'All'
    });

    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all announcements (sorted newest first)
// @route   GET /api/announcements
export const getAnnouncements = async (req, res) => {
  try {
    // Sort by date -1 means newest announcements show up at the top
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};