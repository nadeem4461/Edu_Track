import Student from '../models/Student.js';

// @desc    Register a new student (Admission)
// @route   POST /api/students
export const addStudent = async (req, res) => {
  try {
    const { name, className, parentPhone, loginPhone, totalFee, day, month, year } = req.body;
    const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    const student = await Student.create({
      name, className, parentPhone, loginPhone, totalFee, dob, pendingBalance: totalFee
    });
    res.status(201).json(student);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Get all students
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({});
    res.json(students);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Get a SINGLE student (Fixes the "Stale Remarks" bug on Student Dashboard!)
// @route   GET /api/students/:id
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Delete/Remove a student
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    await student.deleteOne();
    res.status(200).json({ message: 'Student successfully removed' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Add a remark to a student
// @route   POST /api/students/:id/remarks
export const addRemark = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.remarks.push({ type: req.body.type, text: req.body.text });
    await student.save();
    
    res.status(201).json(student);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    NEW: Add a Test Score to a student
// @route   POST /api/students/:id/scores
export const addTestScore = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.scores.push({
      testName: req.body.testName,
      marksObtained: req.body.marksObtained,
      totalMarks: req.body.totalMarks
    });
    
    await student.save();
    res.status(201).json(student);
  } catch (error) { res.status(500).json({ message: error.message }); }
};