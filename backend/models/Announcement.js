import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  targetBatch: { 
    type: String, 
    required: true,
    default: 'All' // Can be 'All', 'Class 10', etc.
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;