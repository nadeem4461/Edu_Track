import Student from '../models/Student.js';

// @desc    Register a new student (Admission)
// @route   POST /api/students
export const addStudent = async (req, res) => {
  try {
    const { name, className, parentPhone, loginPhone, totalFee, day, month, year } = req.body;

    const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const student = await Student.create({
      name,
      className,
      parentPhone,
      loginPhone,
      totalFee,
      dob,
      pendingBalance: totalFee
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