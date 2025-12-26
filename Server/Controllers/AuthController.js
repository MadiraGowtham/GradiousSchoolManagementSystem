import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Users from '../models/Users.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Profile from '../models/Profile.js';

// Configure email transporter (update with your email service details)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate JWT Token
const generateToken = (userId, email, userType) => {
  return jwt.sign(
    { userId, email, userType },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role, regNumber, classEnrolled } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await Users.findOne({ Email: email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Generate unique UserID
    const UserID = `USER-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create new user
    const user = new Users({
      UserID,
      Name: name,
      Email: email,
      Password: password, // Will be hashed by pre-save middleware
      UserType: role,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    });

    await user.save();

    // If user is a student, create student record
    if (role === 'Student' && regNumber && classEnrolled) {
      const student = new Student({
        UserID: user.UserID,
        regNumber,
        classEnrolled,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      });
      await student.save();
    }

    // Generate token
    const token = generateToken(user.UserID, user.Email, user.UserType);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          UserID: user.UserID,
          name: user.Name,
          email: user.Email,
          role: user.UserType
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await Users.findOne({ Email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password using the comparePassword method from schema
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login time
    user.UpdatedAt = new Date();
    await user.save();

    // Get profile and role-specific data
    const profile = await Profile.findOne({ UserID: user.UserID });
    let roleData = {};
    
    if (user.UserType === 'Student') {
      const studentData = await Student.findOne({ UserID: user.UserID });
      if (studentData) {
        roleData = {
          REG: studentData.REG,
          ClassEnrolled: studentData.ClassEnrolled
        };
      }
    } else if (user.UserType === 'Teacher') {
      const teacherData = await Teacher.findOne({ UserID: user.UserID });
      if (teacherData) {
        roleData = {
          REG: teacherData.REG,
          ClassAssigned: teacherData.ClassAssigned,
          Subject: teacherData.Subject
        };
      }
    }

    // Generate token
    const token = generateToken(user.UserID, user.Email, user.UserType);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          UserID: user.UserID,
          Name: user.Name,
          Email: user.Email,
          UserType: user.UserType,
          AccountStatus: user.AccountStatus,
          ...(profile && {
            REG: profile.REG,
            Address: profile.Address,
            Phone: profile.Phone,
            Bio: profile.Bio,
            Gender: profile.Gender,
            Age: profile.Age
          }),
          ...roleData
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user
    const user = await Users.findOne({ Email: email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    // Send email (uncomment when email service is configured)
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: `
    //     <h2>Password Reset Request</h2>
    //     <p>Hello ${user.Name},</p>
    //     <p>You requested to reset your password. Click the link below to reset it:</p>
    //     <a href="${resetUrl}">${resetUrl}</a>
    //     <p>This link will expire in 1 hour.</p>
    //     <p>If you didn't request this, please ignore this email.</p>
    //   `
    // };
    // await transporter.sendMail(mailOptions);
    
    // For now, just log the reset URL (remove in production)
    console.log('Password reset URL:', resetUrl);

    res.status(200).json({
      success: true,
      message: `Password reset link sent to ${email}`
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, token } = req.body;

    if (!email || !newPassword || !token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Find user
    const user = await Users.findOne({ Email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.Password = newPassword; // Will be hashed by pre-save middleware
    user.UpdatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // req.user should be set by auth middleware
    const userId = req.user.userId || req.user.userID;
    const user = await Users.findOne({ 
      $or: [
        { UserID: userId },
        { Email: req.user.email }
      ]
    }).select('-Password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get profile
    const profile = await Profile.findOne({ UserID: user.UserID });
    
    // Get role-specific data
    let roleData = null;
    if (user.UserType === 'Student') {
      const studentData = await Student.findOne({ UserID: user.UserID });
      if (studentData) {
        roleData = {
          REG: studentData.REG,
          ClassEnrolled: studentData.ClassEnrolled
        };
      }
    } else if (user.UserType === 'Teacher') {
      const teacherData = await Teacher.findOne({ UserID: user.UserID });
      if (teacherData) {
        roleData = {
          REG: teacherData.REG,
          ClassAssigned: teacherData.ClassAssigned,
          Subject: teacherData.Subject
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        UserID: user.UserID,
        Name: user.Name,
        Email: user.Email,
        UserType: user.UserType,
        AccountStatus: user.AccountStatus,
        CreatedAt: user.CreatedAt,
        UpdatedAt: user.UpdatedAt,
        ...(profile && {
          REG: profile.REG,
          Address: profile.Address,
          Phone: profile.Phone,
          Bio: profile.Bio,
          Gender: profile.Gender,
          Age: profile.Age,
          ImageUrl: profile.ImageUrl
        }),
        ...(roleData && roleData)
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, regNumber, classEnrolled } = req.body;

    const user = await Users.findOne({ UserID: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.Email) {
      const existingUser = await Users.findOne({ Email: email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.Email = email;
    }

    if (name) user.Name = name;
    user.UpdatedAt = new Date();
    await user.save();

    // Update student data if applicable
    if (user.UserType === 'Student' && (regNumber || classEnrolled)) {
      const student = await Student.findOne({ UserID: user.UserID });
      if (student) {
        if (regNumber) student.regNumber = regNumber;
        if (classEnrolled) student.classEnrolled = classEnrolled;
        student.UpdatedAt = new Date();
        await student.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        UserID: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.UserType
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await Users.findOne({ UserID: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.Password = newPassword; // Will be hashed by pre-save middleware
    user.UpdatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint can be used for logging purposes or clearing any server-side sessions if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};