import Student from '../models/Student.js';
export const studentLogin= async (req,res)=>{
    try {
        const {phone , day, month, year} = req.body;
        const inputDob= `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const student = await Student.findOne({
            loginPhone: phone,
            dob: inputDob
        });
        if(!student){
           return res.status(401).json({ message: 'Invalid credentials. Check Phone or DOB.' });
        }
        res.json({
            message: 'Login successful',
            student:{
                id:student._id,
                name: student.name,
                balance: student.pendingBalance,
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
