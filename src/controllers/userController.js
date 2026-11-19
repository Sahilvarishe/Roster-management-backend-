import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Pod from '../models/Pod.js';
import { memoryUsers } from './authController.js';
import { getDBStatus } from '../config/db.js';

/**
 * @desc Get all users
 * @route GET /api/users
 * @access Admin, Operations Manager
 */
export const getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const dbStatus = getDBStatus();
    let usersList = [];

    if (dbStatus.connected) {
      const filter = {};
      if (role && role !== 'All') {
        filter.role = role.toLowerCase();
      }
      if (status && status !== 'All') {
        filter.isActive = status === 'Active';
      }
      if (search && search.trim()) {
        const q = search.trim();
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { employeeId: { $regex: q, $options: 'i' } },
          { podId: { $regex: q, $options: 'i' } }
        ];
      }
      usersList = await User.find(filter).sort({ createdAt: -1 });
    }

    if (!usersList.length) {
      usersList = memoryUsers.filter((u) => {
        if (role && role !== 'All' && u.role !== role.toLowerCase()) return false;
        if (status && status !== 'All' && (status === 'Active' ? !u.isActive : u.isActive)) return false;
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          const match =
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.employeeId || '').toLowerCase().includes(q) ||
            (u.podId || '').toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: usersList.length,
      data: usersList.map((u) => (typeof u.toJSON === 'function' ? u.toJSON() : u))
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user registry.'
    });
  }
};

/**
 * @desc Create user account
 * @route POST /api/users
 * @access Admin, Operations Manager (restricted)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, podId, isActive } = req.body;
    const currentUserRole = req.user.role;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role.toLowerCase().trim();

    // Privilege Escalation Prevention
    if (currentUserRole === 'operations_manager' && normalizedRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Operations Managers cannot create Administrator accounts.'
      });
    }

    if (!['admin', 'operations_manager', 'pod_lead', 'employee'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Role "${normalizedRole}" is invalid. Valid roles: Admin, Operations Manager, Pod Lead, Employee.`
      });
    }

    // Role-specific constraints
    if (normalizedRole === 'pod_lead' && !podId) {
      return res.status(400).json({
        success: false,
        message: 'A Pod Lead must be assigned to an operational pod.'
      });
    }

    if (normalizedRole === 'employee' && !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'An Employee account must be linked to an employee ID.'
      });
    }

    // Check duplicate email
    const dbStatus = getDBStatus();
    let existing = null;
    if (dbStatus.connected) {
      try { existing = await User.findOne({ email: normalizedEmail }); } catch (e) {}
    }
    if (!existing) {
      existing = memoryUsers.find((u) => u.email === normalizedEmail);
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${normalizedEmail}" already exists.`
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    let newUser = null;

    if (dbStatus.connected) {
      try {
        newUser = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: normalizedRole,
          employeeId: employeeId?.trim() || null,
          podId: podId?.trim() || null,
          isActive: isActive !== false,
          mustChangePassword: true
        });
      } catch (e) {
        console.warn('Mongo user creation fell back to memory:', e.message);
      }
    }

    if (!newUser) {
      newUser = {
        _id: `mem-user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: normalizedRole,
        employeeId: employeeId?.trim() || null,
        podId: podId?.trim() || null,
        isActive: isActive !== false,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        comparePassword: async function (pw) { return await bcrypt.compare(pw, this.passwordHash); },
        toJSON: function () {
          const u = { ...this };
          delete u.passwordHash;
          return u;
        }
      };
      memoryUsers.unshift(newUser);
    }

    res.status(201).json({
      success: true,
      message: `User account for "${newUser.name}" (${newUser.role}) created successfully.`,
      data: typeof newUser.toJSON === 'function' ? newUser.toJSON() : newUser
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user account.'
    });
  }
};

/**
 * @desc Update user account
 * @route PUT /api/users/:id
 * @access Admin, Operations Manager (restricted)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, employeeId, podId, isActive } = req.body;
    const currentUserRole = req.user.role;
    const dbStatus = getDBStatus();

    let targetUser = null;
    if (dbStatus.connected && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      try { targetUser = await User.findById(id); } catch (e) {}
    }
    if (!targetUser) {
      targetUser = memoryUsers.find((u) => String(u._id) === String(id));
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Operations Manager restrictions
    if (currentUserRole === 'operations_manager') {
      if (targetUser.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Operations Managers cannot modify Administrator accounts.'
        });
      }
      if (role && role.toLowerCase() === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Operations Managers cannot elevate accounts to Administrator role.'
        });
      }
    }

    // Check duplicate email if changing
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const emailExists = memoryUsers.some((u) => u.email === email.toLowerCase().trim() && String(u._id) !== String(id));
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: `The email "${email}" is already used by another account.`
        });
      }
      targetUser.email = email.toLowerCase().trim();
    }

    if (name) targetUser.name = name.trim();
    if (role) targetUser.role = role.toLowerCase().trim();
    if (employeeId !== undefined) targetUser.employeeId = employeeId ? employeeId.trim() : null;
    if (podId !== undefined) targetUser.podId = podId ? podId.trim() : null;
    if (isActive !== undefined) targetUser.isActive = Boolean(isActive);

    if (typeof targetUser.save === 'function') {
      await targetUser.save();
    }

    res.status(200).json({
      success: true,
      message: `User account "${targetUser.name}" updated successfully.`,
      data: typeof targetUser.toJSON === 'function' ? targetUser.toJSON() : targetUser
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user account.'
    });
  }
};

/**
 * @desc Toggle user active state
 * @route PATCH /api/users/:id/toggle-status
 * @access Admin, Operations Manager (restricted)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserRole = req.user.role;
    const dbStatus = getDBStatus();

    let targetUser = null;
    if (dbStatus.connected && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      try { targetUser = await User.findById(id); } catch (e) {}
    }
    if (!targetUser) {
      targetUser = memoryUsers.find((u) => String(u._id) === String(id));
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (currentUserRole === 'operations_manager' && targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Operations Managers cannot deactivate Administrator accounts.'
      });
    }

    // Prevent user deactivating themselves
    if (req.user._id?.toString() === targetUser._id?.toString() || req.user.email === targetUser.email) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own active session account.'
      });
    }

    targetUser.isActive = !targetUser.isActive;
    if (typeof targetUser.save === 'function') {
      await targetUser.save();
    }

    res.status(200).json({
      success: true,
      message: `User "${targetUser.name}" has been ${targetUser.isActive ? 'activated' : 'deactivated'}.`,
      data: typeof targetUser.toJSON === 'function' ? targetUser.toJSON() : targetUser
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle account status.'
    });
  }
};

/**
 * @desc Reset user password by Admin/Manager
 * @route POST /api/users/:id/reset-password
 * @access Admin, Operations Manager (restricted)
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { temporaryPassword, newPassword } = req.body;
    const pwd = newPassword || temporaryPassword;
    const currentUserRole = req.user.role;
    const dbStatus = getDBStatus();

    if (!pwd || pwd.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    let targetUser = null;
    if (dbStatus.connected && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      try { targetUser = await User.findById(id); } catch (e) {}
    }
    if (!targetUser) {
      targetUser = memoryUsers.find((u) => String(u._id) === String(id));
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (currentUserRole === 'operations_manager' && targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Operations Managers cannot reset Administrator passwords.'
      });
    }

    targetUser.passwordHash = await bcrypt.hash(pwd, 10);
    targetUser.mustChangePassword = false;
    if (typeof targetUser.save === 'function') {
      await targetUser.save();
    }

    res.status(200).json({
      success: true,
      message: `Password reset successfully for "${targetUser.name}".`
    });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.'
    });
  }
};

/**
 * @desc Delete user account
 * @route DELETE /api/users/:id
 * @access Admin only
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (req.user._id?.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    if (dbStatus.connected && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        await User.findByIdAndDelete(id);
      } catch (e) {}
    }

    const idx = memoryUsers.findIndex((u) => String(u._id) === String(id));
    if (idx !== -1) {
      memoryUsers.splice(idx, 1);
    }

    res.status(200).json({
      success: true,
      message: 'User account removed successfully.'
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user.'
    });
  }
};
