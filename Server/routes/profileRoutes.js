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
    // Save to Server/uploads instead of Client/public/uploads
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✓ Created uploads directory:', uploadDir);
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
    
    console.log('✓ Profile updated successfully:', req.params.userID);
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload profile image
router.post('/:userID/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    console.log('📸 Received image upload request for user:', req.params.userID);
    
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    console.log('✓ File received:', req.file.filename);

    const profile = await Profile.findOne({ UserID: req.params.userID });
    if (!profile) {
      // Delete uploaded file if profile doesn't exist
      fs.unlinkSync(req.file.path);
      console.log('❌ Profile not found, deleted uploaded file');
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Delete old image if it exists and is not default
    if (profile.ImageUrl && 
        profile.ImageUrl !== './Avatar.png' && 
        !profile.ImageUrl.startsWith('http') &&
        profile.ImageUrl.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, '..', profile.ImageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('✓ Deleted old image:', oldImagePath);
      }
    }

    // Update profile with new image URL
    profile.ImageUrl = `/uploads/${req.file.filename}`;
    profile.LastUpdated = new Date();
    await profile.save();

    console.log('✓ Profile image updated successfully:', profile.ImageUrl);

    res.json({ 
      success: true, 
      data: profile,
      imageUrl: profile.ImageUrl,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('✓ Cleaned up uploaded file due to error');
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
  
  next();
});

export default router;
