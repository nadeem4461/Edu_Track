import Student from '../models/Student.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const generateToken = (id, role, className) => {
  return jwt.sign({ id, role, className }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Student Login
// @route   POST /api/auth/student
export const studentLogin = async (req, res) => {
    try {
        // 1. Match the exact variable names sent by React (Login.jsx)
        const { loginPhone, dob } = req.body;
        
        // 2. React already formats the 'dob' perfectly (YYYY-MM-DD), so we just search!
        const student = await Student.findOne({
            loginPhone: loginPhone,
            dob: dob
        });

        if(!student){
           return res.status(401).json({ message: 'Invalid credentials. Check Phone or DOB.' });
        }

        // Generate token and return it with student info
        const token = generateToken(student._id, 'student', student.className);

        // 3. React expects the whole student object back so it can grab ID, Name, and Class
        res.json({
            _id: student._id,
            name: student.name,
            className: student.className,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Login
// @route   POST /api/auth/admin
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Read the secret credentials from your .env file
    const secretUsername = process.env.ADMIN_USERNAME;
    const secretPassword = process.env.ADMIN_PASSWORD;
    
    // Check if the input matches the .env secrets
    if (username === secretUsername && password === secretPassword) {
      const token = generateToken('admin_id', 'admin', null);
      res.json({ role: 'admin', name: 'Sir', token });
    } else {
      res.status(401).json({ message: 'Invalid Admin Credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};