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
    
    // Direct class filtering using the Class field
    if (classNum) {
      query.Class = parseInt(classNum);
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
    const { REG, Class, Subject, MarksObtained, Exam, Remarks } = req.body;

    console.log('Received mark creation request:', req.body);

    // Validate required fields
    if (!REG || Class === undefined || !Subject || MarksObtained === undefined || !Exam) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: REG, Class, Subject, MarksObtained, and Exam are required' 
      });
    }

    // Validate marks range
    const marksNum = parseInt(MarksObtained);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      console.log('Invalid marks range:', MarksObtained);
      return res.status(400).json({ success: false, message: 'Marks must be between 0 and 100' });
    }

    // Validate class
    const classNum = parseInt(Class);
    if (isNaN(classNum) || classNum < 1 || classNum > 12) {
      console.log('Invalid class:', Class);
      return res.status(400).json({ success: false, message: 'Class must be between 1 and 12' });
    }

    // Verify student exists and belongs to the specified class
    console.log('Looking for student with REG:', REG);
    const student = await Student.findOne({ REG: REG });
    
    if (!student) {
      console.log('Student not found:', REG);
      console.log('Available students:', await Student.find({}).select('REG Name'));
      return res.status(404).json({ success: false, message: `Student not found with REG: ${REG}` });
    }

    console.log('Found student:', student.REG, 'in class:', student.ClassEnrolled);

    if (student.ClassEnrolled !== classNum) {
      console.log(`Class mismatch: Student in ${student.ClassEnrolled}, trying to add for ${classNum}`);
      return res.status(400).json({ 
        success: false, 
        message: `Student ${REG} is enrolled in class ${student.ClassEnrolled}, not class ${classNum}` 
      });
    }

    // Check for duplicate
    const existingMark = await Marks.findOne({ REG, Subject, Exam });
    if (existingMark) {
      console.log('Duplicate mark found:', existingMark);
      return res.status(400).json({ 
        success: false, 
        message: `Result already exists for ${REG} in ${Subject} for ${Exam}` 
      });
    }

    const mark = new Marks({
      REG,
      Class: classNum,
      Subject,
      MarksObtained: marksNum,
      Exam,
      Remarks: Remarks || ''
    });
    
    await mark.save();
    console.log('Mark created successfully:', mark);

    res.status(201).json({ success: true, data: mark });
  } catch (error) {
    console.error('Error creating mark:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Result already exists for this student, subject, and exam' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create marks for a class (Teacher/Admin only)
router.post('/bulk', authenticate, authorize('Teacher', 'Admin'), async (req, res) => {
  try {
    const { Class, Subject, Exam, marks } = req.body;

    if (!Class || !Subject || !Exam || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: Class, Subject, Exam, and marks array are required' 
      });
    }

    const classNum = parseInt(Class);
    if (isNaN(classNum) || classNum < 1 || classNum > 12) {
      return res.status(400).json({ success: false, message: 'Class must be between 1 and 12' });
    }

    // Validate and prepare bulk insert data
    const bulkMarks = [];
    const errors = [];

    for (const item of marks) {
      const { REG, MarksObtained, Remarks } = item;
      
      if (!REG || MarksObtained === undefined) {
        errors.push(`Missing REG or MarksObtained for one entry`);
        continue;
      }

      const marksNum = parseInt(MarksObtained);
      if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
        errors.push(`Invalid marks for ${REG}: ${MarksObtained}`);
        continue;
      }

      // Verify student exists and belongs to the class
      const student = await Student.findOne({ REG });
      if (!student) {
        errors.push(`Student not found: ${REG}`);
        continue;
      }

      if (student.ClassEnrolled !== classNum) {
        errors.push(`${REG} is enrolled in class ${student.ClassEnrolled}, not class ${classNum}`);
        continue;
      }

      bulkMarks.push({
        REG,
        Class: classNum,
        Subject,
        MarksObtained: marksNum,
        Exam,
        Remarks: Remarks || ''
      });
    }

    if (bulkMarks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid marks to insert',
        errors 
      });
    }

    // Use insertMany with ordered:false to continue on duplicate key errors
    const result = await Marks.insertMany(bulkMarks, { ordered: false })
      .catch(error => {
        if (error.code === 11000) {
          // Some duplicates were found, but others might have been inserted
          return { insertedCount: error.result?.nInserted || 0 };
        }
        throw error;
      });

    res.status(201).json({ 
      success: true, 
      message: `Inserted ${result.insertedCount || bulkMarks.length} marks`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
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

// Get marks statistics by class and exam
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { class: classNum, exam } = req.query;
    
    if (!classNum || !exam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class and Exam parameters are required' 
      });
    }

    const stats = await Marks.aggregate([
      { 
        $match: { 
          Class: parseInt(classNum), 
          Exam: exam 
        } 
      },
      {
        $group: {
          _id: '$Subject',
          avgMarks: { $avg: '$MarksObtained' },
          maxMarks: { $max: '$MarksObtained' },
          minMarks: { $min: '$MarksObtained' },
          totalStudents: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
