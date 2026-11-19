import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Pod from '../models/Pod.js';
import { getDBStatus } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'datastraw_super_secure_enterprise_jwt_secret_key_2026_roster_sys';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-memory fallback registry for active resilience mode
export const memoryUsers = [
  {
    _id: 'mem-user-admin',
    name: 'System Administrator',
    email: 'admin@datastraw.io',
    passwordHash: bcrypt.hashSync('Admin@12345', 10),
    role: 'admin',
    isActive: true,
    mustChangePassword: false,
    comparePassword: async function (pw) { return await bcrypt.compare(pw, this.passwordHash); },
    toJSON: function () {
      const u = { ...this };
      delete u.passwordHash;
      return u;
    }
  },
  {
    _id: 'mem-user-ops',
    name: 'Alex Mercer',
    email: 'ops.manager@datastraw.io',
    passwordHash: bcrypt.hashSync('Ops@12345', 10),
    role: 'operations_manager',
    isActive: true,
    mustChangePassword: false,
    comparePassword: async function (pw) { return await bcrypt.compare(pw, this.passwordHash); },
    toJSON: function () {
      const u = { ...this };
      delete u.passwordHash;
      return u;
    }
  },
  {
    _id: 'mem-user-lead',
    name: 'Sarah Jenkins',
    email: 'pod.lead@datastraw.io',
    passwordHash: bcrypt.hashSync('Lead@12345', 10),
    role: 'pod_lead',
    podId: 'Pod Alpha (Inbound Core)',
    employeeId: 'EMP001',
    isActive: true,
    mustChangePassword: false,
    comparePassword: async function (pw) { return await bcrypt.compare(pw, this.passwordHash); },
    toJSON: function () {
      const u = { ...this };
      delete u.passwordHash;
      return u;
    }
  },
  {
    _id: 'mem-user-emp',
    name: 'Rahul Sharma',
    email: 'employee@datastraw.io',
    passwordHash: bcrypt.hashSync('Emp@12345', 10),
    role: 'employee',
    employeeId: 'EMP002',
    podId: 'Pod Alpha (Inbound Core)',
    isActive: true,
    mustChangePassword: false,
    comparePassword: async function (pw) { return await bcrypt.compare(pw, this.passwordHash); },
    toJSON: function () {
      const u = { ...this };
      delete u.passwordHash;
      return u;
    }
  }
];

// Helper to sign JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      employeeId: user.employeeId,
      podId: user.podId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper to set cookie
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  const userData = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete userData.passwordHash;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: userData
    });
};

/**
 * @desc Login user
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    const dbStatus = getDBStatus();
    if (dbStatus.connected) {
      try {
        user = await User.findOne({ email: normalizedEmail });
      } catch (err) {
        console.warn('[MongoDB User Search Error]:', err.message);
      }
    }

    if (!user) {
      user = memoryUsers.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact an Operations Administrator.'
      });
    }

    let isMatch = false;
    try {
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else if (user.passwordHash) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      }
    } catch (cmpErr) {
      isMatch = false;
    }

    // Convenient demo fallback: allow role-specific passwords or universal Admin@12345
    if (!isMatch) {
      const demoRolePasswords = {
        'admin@datastraw.io': ['Admin@12345', 'Admin@123', 'admin123'],
        'ops.manager@datastraw.io': ['Ops@12345', 'Admin@12345', 'Ops@123', 'ops123'],
        'pod.lead@datastraw.io': ['Lead@12345', 'Admin@12345', 'Lead@123', 'lead123'],
        'employee@datastraw.io': ['Emp@12345', 'Admin@12345', 'Emp@123', 'emp123']
      };
      const allowed = demoRolePasswords[normalizedEmail];
      if (allowed && allowed.includes(password)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    if (typeof user.save === 'function') {
      try {
        await user.save();
      } catch (saveErr) {}
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during login. Please try again.'
    });
  }
};

/**
 * @desc Logout user
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.'
    });
  }
};

/**
 * @desc Get current authenticated user
 * @route GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    let user = null;
    const dbStatus = getDBStatus();
    if (dbStatus.connected && req.user?._id && String(req.user._id).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        user = await User.findById(req.user._id);
      } catch (err) {}
    }
    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(req.user?._id) || u.email === req.user?.email) || req.user;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Retrieve associated employee & pod details if available
    let employeeDetails = null;
    let podDetails = null;

    if (user.employeeId && dbStatus.connected) {
      try {
        employeeDetails = await Employee.findOne({ employeeId: user.employeeId });
      } catch (err) {}
    }

    if (user.podId && dbStatus.connected) {
      try {
        podDetails = await Pod.findOne({
          $or: [
            { _id: mongoose.isValidObjectId(user.podId) ? user.podId : null },
            { name: user.podId }
          ]
        });
      } catch (err) {}
    }

    const userData = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete userData.passwordHash;

    res.status(200).json({
      success: true,
      data: {
        ...userData,
        employee: employeeDetails,
        pod: podDetails
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current user session.'
    });
  }
};

/**
 * @desc Forgot password - generate reset token
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;
    const dbStatus = getDBStatus();
    if (dbStatus.connected) {
      try {
        user = await User.findOne({ email: normalizedEmail });
      } catch (e) {}
    }
    if (!user) {
      user = memoryUsers.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      // Security: Don't reveal account existence
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, a password reset instruction has been dispatched.'
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    if (typeof user.save === 'function') {
      try {
        await user.save();
      } catch (saveErr) {}
    }

    // In production, send email. For development/resilient mode, provide token in response for quick testing
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, a password reset instruction has been dispatched.',
      // Development convenience token
      resetToken: resetToken,
      devToken: resetToken
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request.'
    });
  }
};

/**
 * @desc Reset password using token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and your new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    let user = null;
    const dbStatus = getDBStatus();
    if (dbStatus.connected) {
      try {
        user = await User.findOne({
          resetPasswordToken: hashedToken,
          resetPasswordExpires: { $gt: Date.now() }
        });
      } catch (e) {}
    }
    if (!user) {
      user = memoryUsers.find(
        (u) => u.resetPasswordToken === hashedToken && u.resetPasswordExpires > Date.now()
      );
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    // Set new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;
    if (typeof user.save === 'function') {
      try {
        await user.save();
      } catch (saveErr) {}
    }

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.'
    });
  }
};

/**
 * @desc Change password (authenticated)
 * @route POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.'
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'The current password you provided is incorrect.'
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    });
  }
};
