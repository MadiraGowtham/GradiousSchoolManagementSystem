import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MarksSchema = new Schema({
    REG: { type: String, required: true, ref: 'Student' },
    Class: { type: Number, required: true },  // Added Class field
    Subject: { type: String, required: true },
    MarksObtained: { type: Number, required: true, min: 0, max: 100 },
    Exam: { type: String, required: true },
    Remarks: { type: String, default: '' },
    LastUpdated: { type: Date, default: Date.now }
});

// Compound index for unique marks per student, subject, and exam
MarksSchema.index({ REG: 1, Subject: 1, Exam: 1 }, { unique: true });

// Additional index for efficient class-based queries
MarksSchema.index({ Class: 1, Exam: 1 });

const Marks = mongoose.model('Marks', MarksSchema);

export default Marks;
