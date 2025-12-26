import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TeacherSchema = new Schema({
    UserID: { type: String, required: true, ref: 'Users' },
    REG: { type: String, required: true, unique: true },
    ClassAssigned: [{ type: Number }],
    Subject: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', TeacherSchema);

export default Teacher;