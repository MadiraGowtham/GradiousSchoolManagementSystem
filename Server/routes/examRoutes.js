// Backend Exam Routes - exam.js
// Place this file in your backend routes folder

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
    const { ExamName, Description } = req.body;

    if (!ExamName || !ExamName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam name is required' 
      });
    }

    // Check if exam with same name already exists
    const existingExam = await Exam.findOne({ ExamName: ExamName.trim() });
    if (existingExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam with this name already exists' 
      });
    }

    const exam = new Exam({ 
      ExamName: ExamName.trim(),
      Description: Description || '',
      CreatedBy: req.user?.Email || 'Unknown',
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    });
    await exam.save();

    console.log('Created exam:', exam);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update exam (Admin only)
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { ExamName, Description } = req.body;

    if (!ExamName || !ExamName.trim()) {
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
      ExamName: ExamName.trim(), 
      _id: { $ne: req.params.id } 
    });
    if (existingExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam with this name already exists' 
      });
    }

    exam.ExamName = ExamName.trim();
    if (Description !== undefined) exam.Description = Description;
    exam.UpdatedAt = new Date();
    await exam.save();

    res.json({ success: true, data: exam });
  } catch (error) {
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
