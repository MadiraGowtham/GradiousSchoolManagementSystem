import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const StudentSchema = new Schema({
    UserID: { type: String, required: true, ref: 'Users' },
    REG: { type: String, required: true, unique: true },
    ClassEnrolled: { type: Number, required: true },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', StudentSchema);

export default Student;