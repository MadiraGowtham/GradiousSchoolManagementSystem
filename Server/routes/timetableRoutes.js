import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Class from '../models/Class.js';

const router = express.Router();

// Get timetable for a class
router.get('/:class', authenticate, async (req, res) => {
  try {
    const classData = await Class.findOne({ Class: parseInt(req.params.class) });
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all classes
router.get('/', authenticate, async (req, res) => {
  try {
    const classes = await Class.find().sort({ Class: 1 });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update timetable (Admin only)
router.put('/:class', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { TimeTable } = req.body;
    const classNum = parseInt(req.params.class);

    let classData = await Class.findOne({ Class: classNum });
    
    if (!classData) {
      classData = new Class({ Class: classNum, TimeTable: TimeTable || {} });
    } else {
      classData.TimeTable = TimeTable || classData.TimeTable;
      classData.UpdatedAt = new Date();
    }
    
    await classData.save();
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

