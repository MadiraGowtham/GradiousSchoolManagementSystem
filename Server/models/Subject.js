import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const SubjectSchema = new Schema({
    SubjectName: { type: String, required: true },
    SubjectCode: { type: String, required: true, unique: true },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now }
});

const Subject = mongoose.model('Subject', SubjectSchema);

export default Subject;