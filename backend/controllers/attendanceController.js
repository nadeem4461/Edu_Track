import Attendance from '../models/Attendence.js';
import Student from '../models/Student.js';

// @desc    Mark attendance for a student
// @route   POST /api/attendance
export const markAttendance = async (req, res) => {
  try {
    const { studentId, status, date } = req.body;

    // 1. Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Normalize date (set time to 00:00:00) so we don't get duplicate entries for the same day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // 3. Create or Update attendance (Upsert)
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date: attendanceDate },
      { status },
      { upsert: true, new: true }
    );

    // TODO: Later, we will trigger the WhatsApp message here if status === 'Absent'

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};