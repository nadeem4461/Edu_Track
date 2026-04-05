import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  className: { type: String, required: true },
  
  // COMPULSORY: For WhatsApp/SMS alerts from Sir
  parentPhone: { 
    type: String, 
    required: true, 
    match: [/^\d{10}$/, 'Parent phone must be 10 digits'] 
  },
  
  // PORTAL LOGIN: Can be student's or parent's number
  loginPhone: { 
    type: String, 
    required: true, 
    match: [/^\d{10}$/, 'Login phone must be 10 digits'] 
  },
  
  dob: { type: String, required: true }, // Format: YYYY-MM-DD
  
  totalFee: { type: Number, required: true },
  pendingBalance: { type: Number, default: function() { return this.totalFee; } },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// CRITICAL: This allows one phone number to have multiple accounts (siblings)
// because the combination of LoginPhone + DOB must be unique.
studentSchema.index({ loginPhone: 1, dob: 1 }, { unique: true });

export default mongoose.model('Student', studentSchema);