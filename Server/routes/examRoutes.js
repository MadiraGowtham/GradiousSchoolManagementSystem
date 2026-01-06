import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Exam from '../models/Exam.js';

const router = express.Router();

// Get all exams
router.get('/', authenticate, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ CreatedAt: -1 });
    
    // Filter out any null or invalid entries before sending
    const validExams = exams.filter(exam => exam && exam._id && exam.ExamName);
    
    console.log('Fetched exams:', validExams.length);
    res.json({ success: true, data: validExams });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new exam (Teacher/Admin only)
router.post('/', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    // Support both ExamName (new) and name (old) for backward compatibility
    const examName = req.body.ExamName || req.body.name;
    const description = req.body.Description || req.body.description || '';

    console.log('Received exam creation request:', req.body);
    console.log('Extracted examName:', examName);

    if (!examName || !examName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam name is required' 
      });
    }

    // Check if exam with same name already exists
    const existingExam = await Exam.findOne({ ExamName: examName.trim() });
    if (existingExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam with this name already exists' 
      });
    }

    // Create exam with only the fields defined in schema
    const examData = {
      ExamName: examName.trim(),
      Description: description,
      CreatedBy: req.user?.Email || req.user?.email || 'Unknown'
    };

    // Don't manually set CreatedAt/UpdatedAt - let schema defaults handle it
    const exam = new Exam(examData);
    await exam.save();

    console.log('Created exam successfully:', exam);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam with this name already exists' 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update exam (Admin only)
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const examName = req.body.ExamName || req.body.name;
    const description = req.body.Description || req.body.description;

    if (!examName || !examName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam name is required' 
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if another exam with same name exists
    const existingExam = await Exam.findOne({ 
      ExamName: examName.trim(), 
      _id: { $ne: req.params.id } 
    });
    if (existingExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam with this name already exists' 
      });
    }

    exam.ExamName = examName.trim();
    if (description !== undefined) exam.Description = description;
    exam.UpdatedAt = new Date();
    await exam.save();

    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error updating exam:', error);
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
