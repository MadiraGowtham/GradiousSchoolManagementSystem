import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Users from '../models/Users.js';
import Profile from '../models/Profile.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

const router = express.Router();

// Get all users (Admin/Teacher)
router.get('/', authenticate, async (req, res) => {
  try {
    const { userType } = req.query;
    const currentUser = req.user;
    const userTypeCheck = currentUser.userType || currentUser.UserType;
    
    // If teacher, only show students from their assigned classes
    if ((userTypeCheck === 'Teacher' || userTypeCheck === 'teacher') && userType === 'Student') {
      const userId = currentUser.userId || currentUser.userID || currentUser.UserID;
      const teacher = await Teacher.findOne({ UserID: userId });
      
      if (!teacher) {
        return res.json({ success: true, data: [] });
      }
      
      if (!teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        return res.json({ success: true, data: [] });
      }
      
      // Get students from assigned classes
      const students = await Student.find({ 
        ClassEnrolled: { $in: teacher.ClassAssigned } 
      });
      const studentREGs = students.map(s => s.REG);
      
      if (studentREGs.length === 0) {
        return res.json({ success: true, data: [] });
      }
      
      // Get profiles for these students
      const profiles = await Profile.find({ REG: { $in: studentREGs } });
      const studentUserIDs = profiles.map(p => p.UserID);
      
      if (studentUserIDs.length === 0) {
        return res.json({ success: true, data: [] });
      }
      
      // Get users
      const users = await Users.find({ 
        UserID: { $in: studentUserIDs },
        UserType: 'Student'
      }).select('-Password');
      
      return res.json({ success: true, data: users });
    }
    
    // Admin can see all users
    if (userTypeCheck === 'Admin' || userTypeCheck === 'admin') {
      const query = userType ? { UserType: userType } : {};
      const users = await Users.find(query).select('-Password');
      return res.json({ success: true, data: users });
    }
    
    // Teachers can also see teachers list
    if ((userTypeCheck === 'Teacher' || userTypeCheck === 'teacher') && userType === 'Teacher') {
      const query = { UserType: 'Teacher' };
      const users = await Users.find(query).select('-Password');
      return res.json({ success: true, data: users });
    }
    
    // Default: return empty for unauthorized
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error in get users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await Users.findOne({ UserID: req.params.id }).select('-Password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user (Admin can create anyone, Teachers can create Students)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, password, userType, regNumber, classEnrolled, classAssigned, subject } = req.body;
    const currentUser = req.user;
    const currentUserType = currentUser.userType || currentUser.UserType;

    if (!name || !email || !password || !userType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Permission checks
    if (currentUserType === 'Admin' || currentUserType === 'admin') {
      // Admins can create anyone
    } else if (currentUserType === 'Teacher' || currentUserType === 'teacher') {
      // Teachers can only create students
      if (userType !== 'Student') {
        return res.status(403).json({ 
          success: false, 
          message: 'Teachers can only create student accounts' 
        });
      }

      // Validate teacher can only create students in their assigned classes
      if (classEnrolled) {
        const currentUserId = currentUser.userId || currentUser.userID || currentUser.UserID;
        const teacher = await Teacher.findOne({ UserID: currentUserId });
        
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

        const requestedClass = parseInt(classEnrolled);
        const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
        
        if (!assignedClasses.includes(requestedClass)) {
          return res.status(403).json({ 
            success: false, 
            message: `You can only create students for your assigned classes: ${assignedClasses.join(', ')}` 
          });
        }
      }
    } else {
      // Students or other roles cannot create users
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to create users' 
      });
    }

    const existingUser = await Users.findOne({ Email: email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const userID = `${userType === 'Student' ? 'S' : userType === 'Teacher' ? 'T' : 'A'}${String(Date.now()).slice(-6)}`;
    
    const user = new Users({
      UserID: userID,
      Name: name,
      Email: email,
      Password: password,
      UserType: userType,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    });
    await user.save();

    const profile = new Profile({
      UserID: userID,
      REG: regNumber || userID,
      LastUpdated: new Date()
    });
    await profile.save();

    if (userType === 'Student' && regNumber && classEnrolled) {
      const student = new Student({
        UserID: userID,
        REG: regNumber,
        ClassEnrolled: parseInt(classEnrolled)
      });
      await student.save();
    } else if (userType === 'Teacher' && regNumber && classAssigned && subject) {
      const teacher = new Teacher({
        UserID: userID,
        REG: regNumber,
        ClassAssigned: classAssigned.map(c => parseInt(c)),
        Subject: subject
      });
      await teacher.save();
    }

    res.status(201).json({ success: true, data: { userID, name, email, userType } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (Admin can update anyone, Teachers can update Students in their classes)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, email, password, classEnrolled, classAssigned, subject } = req.body;
    const currentUser = req.user;
    const currentUserType = currentUser.userType || currentUser.UserType;
    
    const user = await Users.findOne({ UserID: req.params.id });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Permission checks
    if (currentUserType === 'Admin' || currentUserType === 'admin') {
      // Admins can update anyone
    } else if (currentUserType === 'Teacher' || currentUserType === 'teacher') {
      // Teachers can only update students in their assigned classes
      if (user.UserType !== 'Student') {
        return res.status(403).json({ 
          success: false, 
          message: 'Teachers can only update student accounts' 
        });
      }

      const currentUserId = currentUser.userId || currentUser.userID || currentUser.UserID;
      const teacher = await Teacher.findOne({ UserID: currentUserId });
      
      if (!teacher || !teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned classes' 
        });
      }

      // Check if student is in teacher's assigned classes
      const student = await Student.findOne({ UserID: req.params.id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
      const studentClass = parseInt(student.ClassEnrolled);
      
      if (!assignedClasses.includes(studentClass)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only update students in your assigned classes' 
        });
      }

      // Validate new class if provided
      if (classEnrolled) {
        const newClass = parseInt(classEnrolled);
        if (!assignedClasses.includes(newClass)) {
          return res.status(403).json({ 
            success: false, 
            message: `You can only assign students to your classes: ${assignedClasses.join(', ')}` 
          });
        }
      }
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update users' 
      });
    }

    // Update user
    if (name) user.Name = name;
    if (email) user.Email = email;
    if (password) user.Password = password;
    user.UpdatedAt = new Date();
    await user.save();

    // Update type-specific data
    if (user.UserType === 'Student' && classEnrolled) {
      const student = await Student.findOne({ UserID: req.params.id });
      if (student) {
        student.ClassEnrolled = parseInt(classEnrolled);
        await student.save();
      }
    } else if (user.UserType === 'Teacher' && (classAssigned || subject)) {
      const teacher = await Teacher.findOne({ UserID: req.params.id });
      if (teacher) {
        if (classAssigned) teacher.ClassAssigned = classAssigned.map(c => parseInt(c));
        if (subject) teacher.Subject = subject;
        await teacher.save();
      }
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (Admin can delete anyone, Teachers can delete Students in their classes)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    const currentUserType = currentUser.userType || currentUser.UserType;
    
    const user = await Users.findOne({ UserID: req.params.id });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Permission checks
    if (currentUserType === 'Admin' || currentUserType === 'admin') {
      // Admins can delete anyone
    } else if (currentUserType === 'Teacher' || currentUserType === 'teacher') {
      // Teachers can only delete students in their assigned classes
      if (user.UserType !== 'Student') {
        return res.status(403).json({ 
          success: false, 
          message: 'Teachers can only delete student accounts' 
        });
      }

      const currentUserId = currentUser.userId || currentUser.userID || currentUser.UserID;
      const teacher = await Teacher.findOne({ UserID: currentUserId });
      
      if (!teacher || !teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned classes' 
        });
      }

      // Check if student is in teacher's assigned classes
      const student = await Student.findOne({ UserID: req.params.id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
      const studentClass = parseInt(student.ClassEnrolled);
      
      if (!assignedClasses.includes(studentClass)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only delete students in your assigned classes' 
        });
      }
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete users' 
      });
    }

    // Delete related records
    await Profile.deleteOne({ UserID: req.params.id });
    
    if (user.UserType === 'Student') {
      await Student.deleteOne({ UserID: req.params.id });
    } else if (user.UserType === 'Teacher') {
      await Teacher.deleteOne({ UserID: req.params.id });
    }
    
    // Delete user
    await Users.deleteOne({ UserID: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;