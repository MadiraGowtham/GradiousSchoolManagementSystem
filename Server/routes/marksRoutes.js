import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Marks from '../models/Marks.js';
import Student from '../models/Student.js';

const router = express.Router();

// Get marks with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { exam, class: classNum, reg, subject } = req.query;
    let query = {};

    if (exam) query.Exam = exam;
    if (subject) query.Subject = subject;
    if (reg) query.REG = reg;

    // If class is specified, filter by students in that class
    if (classNum) {
      const students = await Student.find({ ClassEnrolled: parseInt(classNum) });
      const regs = students.map(s => s.REG);
      query.REG = { $in: regs };
    }

    const marks = await Marks.find(query).sort({ LastUpdated: -1 });
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get marks for a specific student
router.get('/student/:reg', authenticate, async (req, res) => {
  try {
    const marks = await Marks.find({ REG: req.params.reg }).sort({ Exam: 1, Subject: 1 });
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create mark (Teacher/Admin only)
router.post('/', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { REG, Subject, MarksObtained, Exam, Remarks } = req.body;

    if (!REG || !Subject || MarksObtained === undefined || !Exam) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const marksNum = parseInt(MarksObtained);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      return res.status(400).json({ success: false, message: 'Marks must be between 0 and 100' });
    }

    const mark = new Marks({
      REG,
      Subject,
      MarksObtained: marksNum,
      Exam,
      Remarks: Remarks || ''
    });
    await mark.save();

    res.status(201).json({ success: true, data: mark });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Result already exists for this student, subject, and exam' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update mark (Teacher/Admin only)
router.put('/:id', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { MarksObtained, Remarks } = req.body;
    const mark = await Marks.findById(req.params.id);

    if (!mark) {
      return res.status(404).json({ success: false, message: 'Mark not found' });
    }

    if (MarksObtained !== undefined) {
      const marksNum = parseInt(MarksObtained);
      if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
        return res.status(400).json({ success: false, message: 'Marks must be between 0 and 100' });
      }
      mark.MarksObtained = marksNum;
    }
    if (Remarks !== undefined) mark.Remarks = Remarks;
    mark.LastUpdated = new Date();
    await mark.save();

    res.json({ success: true, data: mark });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete mark (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const mark = await Marks.findByIdAndDelete(req.params.id);
    if (!mark) {
      return res.status(404).json({ success: false, message: 'Mark not found' });
    }
    res.json({ success: true, message: 'Mark deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

