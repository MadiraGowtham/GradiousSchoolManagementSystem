import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Announcement from '../models/Announcement.js';
import Teacher from '../models/Teacher.js';

const router = express.Router();

// Get all announcements
router.get('/', authenticate, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ LastUpdated: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get announcement by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create announcement (Admin and Teacher)
router.post('/', authenticate, async (req, res) => {
  try {
    const { Title, Description, Visibility, Class } = req.body;
    const currentUser = req.user;
    const userType = currentUser.userType || currentUser.UserType;

    // Check if user is Admin or Teacher
    if (userType !== 'Admin' && userType !== 'admin' && userType !== 'Teacher' && userType !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins and teachers can create announcements' 
      });
    }

    // If teacher, validate they can only create announcements for their assigned classes
    if (userType === 'Teacher' || userType === 'teacher') {
      if (Visibility === 'Class' || Visibility === 'Student') {
        const userId = currentUser.userId || currentUser.userID || currentUser.UserID;
        const teacher = await Teacher.findOne({ UserID: userId });
        
        if (!teacher) {
          return res.status(403).json({ 
            success: false, 
            message: 'Teacher profile not found' 
          });
        }

        if (!teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
          return res.status(403).json({ 
            success: false, 
            message: 'You have no assigned classes' 
          });
        }

        const requestedClass = parseInt(Class);
        const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
        
        if (!assignedClasses.includes(requestedClass)) {
          return res.status(403).json({ 
            success: false, 
            message: `You can only create announcements for your assigned classes: ${assignedClasses.join(', ')}` 
          });
        }
      }
    }

    const announcement = new Announcement({
      Title,
      Description,
      Visibility,
      Class: Visibility === 'All' ? undefined : Class,
      LastUpdated: new Date()
    });

    await announcement.save();
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update announcement (Admin and Teacher)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { Title, Description, Visibility, Class } = req.body;
    const currentUser = req.user;
    const userType = currentUser.userType || currentUser.UserType;

    // Check if user is Admin or Teacher
    if (userType !== 'Admin' && userType !== 'admin' && userType !== 'Teacher' && userType !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins and teachers can update announcements' 
      });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // If teacher, validate they can only update announcements for their assigned classes
    if (userType === 'Teacher' || userType === 'teacher') {
      const userId = currentUser.userId || currentUser.userID || currentUser.UserID;
      const teacher = await Teacher.findOne({ UserID: userId });
      
      if (!teacher) {
        return res.status(403).json({ 
          success: false, 
          message: 'Teacher profile not found' 
        });
      }

      if (!teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned classes' 
        });
      }

      // Check if announcement is for a class the teacher is assigned to
      if (announcement.Visibility !== 'All' && announcement.Class) {
        const announcementClass = parseInt(announcement.Class);
        const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
        
        if (!assignedClasses.includes(announcementClass)) {
          return res.status(403).json({ 
            success: false, 
            message: 'You can only update announcements for your assigned classes' 
          });
        }
      }

      // Validate new class if being changed
      if (Visibility === 'Class' || Visibility === 'Student') {
        const requestedClass = parseInt(Class);
        const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
        
        if (!assignedClasses.includes(requestedClass)) {
          return res.status(403).json({ 
            success: false, 
            message: `You can only update announcements for your assigned classes: ${assignedClasses.join(', ')}` 
          });
        }
      }
    }

    if (Title) announcement.Title = Title;
    if (Description) announcement.Description = Description;
    if (Visibility) announcement.Visibility = Visibility;
    if (Class !== undefined) announcement.Class = Visibility === 'All' ? undefined : Class;
    announcement.LastUpdated = new Date();

    await announcement.save();
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete announcement (Admin and Teacher - with restrictions for teachers)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    const userType = currentUser.userType || currentUser.UserType;

    // Check if user is Admin or Teacher
    if (userType !== 'Admin' && userType !== 'admin' && userType !== 'Teacher' && userType !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins and teachers can delete announcements' 
      });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // If teacher, validate they can only delete announcements for their assigned classes
    if (userType === 'Teacher' || userType === 'teacher') {
      const userId = currentUser.userId || currentUser.userID || currentUser.UserID;
      const teacher = await Teacher.findOne({ UserID: userId });
      
      if (!teacher) {
        return res.status(403).json({ 
          success: false, 
          message: 'Teacher profile not found' 
        });
      }

      if (!teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned classes' 
        });
      }

      // Teachers can delete announcements that are:
      // 1. Marked as "All" visibility (general announcements)
      // 2. For classes they are assigned to
      if (announcement.Visibility !== 'All' && announcement.Class) {
        const announcementClass = parseInt(announcement.Class);
        const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
        
        if (!assignedClasses.includes(announcementClass)) {
          return res.status(403).json({ 
            success: false, 
            message: 'You can only delete announcements for your assigned classes or general announcements' 
          });
        }
      }
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;