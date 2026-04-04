import Student from '../models/Student.js';

// @desc    Register a new student (Admission)
// @route   POST /api/students
export const addStudent = async (req, res) => {
  try {
    const { name, parentPhone, className, totalFee } = req.body;

    // Check if student already exists (Optional logic)
    const studentExists = await Student.findOne({ parentPhone, name });
    if (studentExists) {
      return res.status(400).json({ message: 'Student already registered with this phone number' });
    }

    const student = await Student.create({
      name,
      parentPhone,
      className,
      totalFee,
      pendingBalance: totalFee // Initial balance is the full fee
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all students (grouped by class later)
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({});
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};