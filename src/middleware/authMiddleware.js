import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memoryUsers } from '../controllers/authController.js';

/**
 * Middleware to authenticate user via JWT (Cookie or Bearer Header)
 */
export const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization Header (Bearer token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to continue.'
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'datastraw_super_secure_enterprise_jwt_secret_key_2026_roster_sys';
    const decoded = jwt.verify(token, secret);

    // Retrieve active user
    let user = null;
    try {
      if (String(decoded.id).match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(decoded.id);
      }
    } catch (dbErr) {
      // Ignore Mongo search error in resilience mode
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(decoded.id) || u.email === decoded.email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this session no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication credentials.'
    });
  }
};

/**
 * Middleware to authorize specific roles
 * @param  {...string} roles - e.g. 'admin', 'operations_manager', 'pod_lead', 'employee'
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${req.user.role}" does not have permission to access this resource.`
      });
    }

    next();
  };
};

/**
 * Middleware to verify active account state
 */
export const verifyActiveAccount = (req, res, next) => {
  if (!req.user || !req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account is deactivated. Please contact system administrator.'
    });
  }
  next();
};
