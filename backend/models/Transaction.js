import mongoose from "mongoose";

const tracnsactionSchema = new mongoose.Schema({
    studentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    date:{
        type:Date,
        default: Date.now
    },
    paymentMode:{
        
    }
})