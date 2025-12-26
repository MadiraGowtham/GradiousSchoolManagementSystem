import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Profile from '../models/Profile.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Users from '../models/Users.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../Client/public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.params.userID}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const router = express.Router();

// Get profile by UserID
router.get('/:userID', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ UserID: req.params.userID });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student info by REG
router.get('/student/:reg', authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ REG: req.params.reg });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get teacher info by REG
router.get('/teacher/:reg', authenticate, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ REG: req.params.reg });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
router.put('/:userID', authenticate, async (req, res) => {
  try {
    const { Address, Phone, Bio, Gender, Age, ImageUrl } = req.body;
    const profile = await Profile.findOne({ UserID: req.params.userID });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (Address !== undefined) profile.Address = Address;
    if (Phone !== undefined) profile.Phone = Phone;
    if (Bio !== undefined) profile.Bio = Bio;
    if (Gender !== undefined) profile.Gender = Gender;
    if (Age !== undefined) profile.Age = Age;
    if (ImageUrl !== undefined) profile.ImageUrl = ImageUrl;
    profile.LastUpdated = new Date();
    
    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload profile image
router.post('/:userID/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const profile = await Profile.findOne({ UserID: req.params.userID });
    if (!profile) {
      // Delete uploaded file if profile doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Delete old image if it exists and is not default
    if (profile.ImageUrl && profile.ImageUrl !== './Avatar.png' && !profile.ImageUrl.startsWith('http')) {
      const oldImagePath = path.join(__dirname, '../../Client/public', profile.ImageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update profile with new image URL
    profile.ImageUrl = `/uploads/${req.file.filename}`;
    profile.LastUpdated = new Date();
    await profile.save();

    res.json({ 
      success: true, 
      data: profile,
      imageUrl: profile.ImageUrl
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

