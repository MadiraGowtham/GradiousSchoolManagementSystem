import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Exam from '../models/Exam.js';

const router = express.Router();

// Get all exams
router.get('/', authenticate, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ ExamName: 1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create exam (Teacher/Admin only)
router.post('/', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { ExamName, Description } = req.body;

    if (!ExamName || !ExamName.trim()) {
      return res.status(400).json({ success: false, message: 'Exam name is required' });
    }

    const trimmedExamName = ExamName.trim();

    // Check if exam already exists
    const existingExam = await Exam.findOne({ ExamName: trimmedExamName });
    if (existingExam) {
      return res.status(400).json({ success: false, message: 'Exam already exists' });
    }

    const exam = new Exam({
      ExamName: trimmedExamName,
      Description: Description || '',
      CreatedBy: req.user.userId || req.user.userID
    });
    await exam.save();

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Exam already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update exam (Teacher/Admin only)
router.put('/:id', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { ExamName, Description } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (ExamName) exam.ExamName = ExamName.trim();
    if (Description !== undefined) exam.Description = Description;
    exam.UpdatedAt = new Date();
    await exam.save();

    res.json({ success: true, data: exam });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Exam name already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete exam (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

