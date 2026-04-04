import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  parentPhone: { 
    type: String, 
    required: true, 
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'] 
  },
  className: { type: String, required: true },
  totalFee: { type: Number, required: true, min: 0 },
  pendingBalance: { 
    type: Number, 
    default: function() { return this.totalFee; } 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);