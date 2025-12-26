import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ExamSchema = new Schema({
    ExamName: { type: String, required: true, unique: true },
    Description: { type: String, default: '' },
    CreatedBy: { type: String, ref: 'Users' },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now }
});

const Exam = mongoose.model('Exam', ExamSchema);

export default Exam;

