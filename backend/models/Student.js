import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  className: { type: String, required: true },
  parentPhone: { type: String, required: true },
  loginPhone: { type: String, required: true, unique: true },
  totalFee: { type: Number, required: true },
  pendingBalance: { type: Number, required: true },
  dob: { type: String, required: true },
  
  // Sir's Feedback
  remarks: [{
    type: { type: String, enum: ['Performance', 'Complaint', 'Note'] },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],

  // NEW: Phase 3 - Academic Scores
  scores: [{
    testName: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }]
  
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;