import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Define Exam schema if it doesn't exist
const ExamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Check if model already exists to avoid OverwriteModelError
const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);

// Get all exams (accessible to all authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single exam by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new exam (Teacher/Admin only)
router.post('/', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Exam name is required' });
    }

    // Check if exam already exists
    const existingExam = await Exam.findOne({ name: name.trim() });
    if (existingExam) {
      return res.status(400).json({ success: false, message: 'Exam with this name already exists' });
    }

    const exam = new Exam({ name: name.trim() });
    await exam.save();

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Exam with this name already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update exam (Admin only)
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Exam name is required' });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Exam with this name already exists' });
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
    console.error('Error deleting exam:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
