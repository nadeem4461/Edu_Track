import Student from '../models/Student.js';

export const payFees = async (req, res) => {
  try {
    const { studentId, amount, paymentMode, remarks } = req.body;

    // 1. Find the specific student in the database
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Deduct the paid amount from their pending balance
    student.pendingBalance -= Number(amount);

    // Safety check: Make sure the balance doesn't accidentally drop below zero
    if (student.pendingBalance < 0) {
      student.pendingBalance = 0;
    }

    // 3. Save the updated student record to MongoDB
    await student.save();

    // 4. Send back the success receipt!
    res.status(200).json({ 
      message: 'Payment recorded successfully',
      newBalance: student.pendingBalance 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};