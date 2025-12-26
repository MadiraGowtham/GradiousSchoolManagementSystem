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
    
    console.log('=== GET USERS ===');
    console.log('Current user type:', userTypeCheck);
    console.log('Requested user type:', userType);
    
    // If teacher, only show students from their assigned classes
    if ((userTypeCheck === 'Teacher' || userTypeCheck === 'teacher') && userType === 'Student') {
      const userId = currentUser.userId || currentUser.userID || currentUser.UserID;
      console.log('Teacher user ID:', userId);
      
      const teacher = await Teacher.findOne({ UserID: userId });
      
      if (!teacher) {
        console.log('Teacher profile not found');
        return res.json({ success: true, data: [] });
      }
      
      console.log('Teacher assigned classes:', teacher.ClassAssigned);
      
      if (!teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        console.log('Teacher has no assigned classes');
        return res.json({ success: true, data: [] });
      }
      
      // Get students from assigned classes
      const students = await Student.find({ 
        ClassEnrolled: { $in: teacher.ClassAssigned } 
      });
      console.log('Students found:', students.length);
      
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
      
      console.log('Returning students:', users.length);
      return res.json({ success: true, data: users });
    }
    
    // Admin can see all users
    if (userTypeCheck === 'Admin' || userTypeCheck === 'admin') {
      const query = userType ? { UserType: userType } : {};
      const users = await Users.find(query).select('-Password');
      console.log('Admin - returning users:', users.length);
      return res.json({ success: true, data: users });
    }
    
    // Teachers can also see teachers list
    if ((userTypeCheck === 'Teacher' || userTypeCheck === 'teacher') && userType === 'Teacher') {
      const query = { UserType: 'Teacher' };
      const users = await Users.find(query).select('-Password');
      console.log('Teacher - returning teachers:', users.length);
      return res.json({ success: true, data: users });
    }
    
    // Default: return empty for unauthorized
    console.log('Unauthorized or no match - returning empty');
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

    console.log('=== CREATE USER ===');
    console.log('Current user type:', currentUserType);
    console.log('Creating user type:', userType);

    if (!name || !email || !password || !userType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Permission checks
    if (currentUserType === 'Admin' || currentUserType === 'admin') {
      console.log('Admin - can create anyone');
    } else if (currentUserType === 'Teacher' || currentUserType === 'teacher') {
      if (userType !== 'Student') {
        console.log('Teacher trying to create non-student');
        return res.status(403).json({ 
          success: false, 
          message: 'Teachers can only create student accounts' 
        });
      }

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
        
        console.log('Teacher assigned classes:', assignedClasses);
        console.log('Requested class:', requestedClass);
        
        if (!assignedClasses.includes(requestedClass)) {
          return res.status(403).json({ 
            success: false, 
            message: `You can only create students for your assigned classes: ${assignedClasses.join(', ')}` 
          });
        }
      }
    } else {
      console.log('Unauthorized user type');
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

    console.log('User created successfully:', userID);
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
    
    console.log('=== UPDATE USER ===');
    console.log('Current user type:', currentUserType);
    console.log('Updating user ID:', req.params.id);
    
    const user = await Users.findOne({ UserID: req.params.id });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('User to update type:', user.UserType);

    // Permission checks
    if (currentUserType === 'Admin' || currentUserType === 'admin') {
      console.log('Admin - can update anyone');
    } else if (currentUserType === 'Teacher' || currentUserType === 'teacher') {
      if (user.UserType !== 'Student') {
        console.log('Teacher trying to update non-student');
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

      const student = await Student.findOne({ UserID: req.params.id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
      const studentClass = parseInt(student.ClassEnrolled);
      
      console.log('Teacher assigned classes:', assignedClasses);
      console.log('Student class:', studentClass);
      
      if (!assignedClasses.includes(studentClass)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only update students in your assigned classes' 
        });
      }

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

    console.log('User updated successfully');
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (Admin can delete anyone, Teachers can delete Students in their classes)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    console.log('=== DELETE USER BACKEND ===');
    console.log('Request user:', req.user);
    console.log('User to delete:', req.params.id);
    
    const currentUser = req.user;
    const currentUserType = currentUser.userType || currentUser.UserType;
    
    console.log('Current user type:', currentUserType);
    
    const user = await Users.findOne({ UserID: req.params.id });
    
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('User to delete type:', user.UserType);

    // Permission checks
    if (currentUserType === 'Admin' || currentUserType === 'admin') {
      console.log('Admin - can delete anyone');
    } else if (currentUserType === 'Teacher' || currentUserType === 'teacher') {
      console.log('Teacher - checking delete permissions');
      
      if (user.UserType !== 'Student') {
        console.log('Teacher cannot delete non-students');
        return res.status(403).json({ 
          success: false, 
          message: 'Teachers can only delete student accounts' 
        });
      }

      const currentUserId = currentUser.userId || currentUser.userID || currentUser.UserID;
      console.log('Current teacher user ID:', currentUserId);
      
      const teacher = await Teacher.findOne({ UserID: currentUserId });
      
      if (!teacher) {
        console.log('Teacher profile not found');
        return res.status(403).json({ 
          success: false, 
          message: 'Teacher profile not found' 
        });
      }

      console.log('Teacher assigned classes:', teacher.ClassAssigned);
      
      if (!teacher.ClassAssigned || teacher.ClassAssigned.length === 0) {
        console.log('Teacher has no assigned classes');
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned classes' 
        });
      }

      const student = await Student.findOne({ UserID: req.params.id });
      if (!student) {
        console.log('Student profile not found');
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      console.log('Student class:', student.ClassEnrolled);

      const assignedClasses = teacher.ClassAssigned.map(c => parseInt(c));
      const studentClass = parseInt(student.ClassEnrolled);
      
      console.log('Assigned classes (parsed):', assignedClasses);
      console.log('Student class (parsed):', studentClass);
      console.log('Is student in assigned class?', assignedClasses.includes(studentClass));
      
      if (!assignedClasses.includes(studentClass)) {
        console.log('Student not in teacher assigned classes');
        return res.status(403).json({ 
          success: false, 
          message: 'You can only delete students in your assigned classes' 
        });
      }

      console.log('Permission check passed - proceeding with delete');
    } else {
      console.log('User type not authorized:', currentUserType);
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete users' 
      });
    }

    // Delete related records
    console.log('Deleting profile...');
    await Profile.deleteOne({ UserID: req.params.id });
    
    if (user.UserType === 'Student') {
      console.log('Deleting student record...');
      await Student.deleteOne({ UserID: req.params.id });
    } else if (user.UserType === 'Teacher') {
      console.log('Deleting teacher record...');
      await Teacher.deleteOne({ UserID: req.params.id });
    }
    
    // Delete user
    console.log('Deleting user...');
    await Users.deleteOne({ UserID: req.params.id });

    console.log('Delete successful');
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
