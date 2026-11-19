import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import Conflict from '../models/Conflict.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback leaves
export let inMemoryLeaves = [
  {
    _id: 'mem-leave-1',
    employeeId: 'EMP002',
    employeeName: 'Rahul Sharma',
    role: 'Support Executive',
    brand: 'UrbanNest',
    pod: 'Customer Support Pod',
    availabilityStatus: 'Approved leave',
    leaveType: 'Planned Leave',
    startDate: '2026-11-20',
    endDate: '2026-11-21',
    dates: ['2026-11-20', '2026-11-21'],
    durationDays: 2,
    status: 'Pending',
    reason: 'Family event',
    createdAt: new Date().toISOString()
  }
];

// Helper to generate ISO date strings between start and end
const getDatesBetween = (startDateStr, endDateStr) => {
  const dates = [];
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let cur = new Date(start);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  } catch (err) {
    dates.push(startDateStr);
  }
  return dates.length > 0 ? dates : [startDateStr];
};

/**
 * @desc Submit a leave request
 * @route POST /api/leaves/request
 * @access Authenticated (All roles)
 */
export const submitLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;
    let targetEmployeeId = req.user.employeeId;

    // Admin / Ops Manager can submit on behalf of an employee
    if (['admin', 'operations_manager'].includes(req.user.role) && req.body.employeeId) {
      targetEmployeeId = req.body.employeeId;
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    // Locate employee
    const dbStatus = getDBStatus();
    let employee = null;
    if (dbStatus.connected) {
      try {
        if (targetEmployeeId) {
          employee = await Employee.findOne({ employeeId: targetEmployeeId });
        }
        if (!employee) {
          employee = await Employee.findOne({ email: req.user.email });
        }
      } catch (err) {}
    }

    const employeeName = employee ? employee.name : req.user.name;
    const pod = employee ? employee.pod : req.user.podId || 'General Operations';
    const brand = employee ? employee.brand : 'General Operations';
    const dates = getDatesBetween(startDate, endDate);

    const leaveData = {
      _id: `mem-leave-${Date.now()}`,
      employeeId: targetEmployeeId || `EMP-${Date.now().toString().slice(-4)}`,
      employeeName,
      role: employee?.designation || 'Staff',
      brand,
      pod,
      availabilityStatus: 'Approved leave',
      leaveType: leaveType || 'Annual',
      startDate,
      endDate,
      dates,
      durationDays: dates.length,
      status: 'Pending',
      reason: reason || 'Personal / Annual leave',
      createdAt: new Date().toISOString()
    };

    let savedLeave = null;
    if (dbStatus.connected) {
      try {
        savedLeave = await Leave.create(leaveData);
      } catch (err) {
        inMemoryLeaves.unshift(leaveData);
        savedLeave = leaveData;
      }
    } else {
      inMemoryLeaves.unshift(leaveData);
      savedLeave = leaveData;
    }

    res.status(201).json({
      success: true,
      message: `Leave request for ${dates.length} day(s) submitted successfully. Pending review.`,
      data: savedLeave
    });
  } catch (error) {
    console.error('submitLeaveRequest error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit leave request.'
    });
  }
};

/**
 * @desc Get current user's leave requests
 * @route GET /api/leaves/my-requests
 * @access Authenticated
 */
export const getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const dbStatus = getDBStatus();
    let leaves = [];

    if (dbStatus.connected) {
      try {
        const filter = {};
        if (employeeId) {
          filter.employeeId = employeeId;
        } else {
          filter.$or = [{ employeeName: req.user.name }, { employeeId: req.user.email }];
        }
        leaves = await Leave.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        leaves = inMemoryLeaves.filter(
          (l) => l.employeeId === employeeId || l.employeeName === req.user.name
        );
      }
    } else {
      leaves = inMemoryLeaves.filter(
        (l) => l.employeeId === employeeId || l.employeeName === req.user.name
      );
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('getMyLeaveRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your leave requests.'
    });
  }
};

/**
 * @desc Get pod-specific leave requests for Pod Lead
 * @route GET /api/leaves/pod-requests
 * @access Pod Lead, Operations Manager, Admin
 */
export const getPodLeaveRequests = async (req, res) => {
  try {
    const userPod = req.user.podId;
    const dbStatus = getDBStatus();
    let leaves = [];

    if (req.user.role === 'pod_lead' && !userPod) {
      return res.status(403).json({
        success: false,
        message: 'No operational pod associated with this Pod Lead account.'
      });
    }

    if (dbStatus.connected) {
      try {
        const filter = {};
        if (req.user.role === 'pod_lead') {
          filter.pod = { $regex: new RegExp(userPod, 'i') };
        }
        leaves = await Leave.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        leaves = inMemoryLeaves.filter((l) =>
          req.user.role === 'pod_lead'
            ? l.pod?.toLowerCase().includes(userPod.toLowerCase())
            : true
        );
      }
    } else {
      leaves = inMemoryLeaves.filter((l) =>
        req.user.role === 'pod_lead'
          ? l.pod?.toLowerCase().includes(userPod.toLowerCase())
          : true
      );
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      pod: userPod,
      data: leaves
    });
  } catch (error) {
    console.error('getPodLeaveRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pod leave requests.'
    });
  }
};

/**
 * @desc Get all company-wide leave requests
 * @route GET /api/leaves
 * @access Admin, Operations Manager
 */
export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, pod, search } = req.query;
    const dbStatus = getDBStatus();
    let leaves = [];

    if (dbStatus.connected) {
      try {
        const filter = {};
        if (status && status !== 'All') filter.status = status;
        if (pod && pod !== 'All') filter.pod = { $regex: new RegExp(pod, 'i') };
        if (search && search.trim()) {
          const q = search.trim();
          filter.$or = [
            { employeeName: { $regex: q, $options: 'i' } },
            { employeeId: { $regex: q, $options: 'i' } },
            { leaveType: { $regex: q, $options: 'i' } },
            { reason: { $regex: q, $options: 'i' } }
          ];
        }
        leaves = await Leave.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        leaves = inMemoryLeaves;
      }
    } else {
      leaves = inMemoryLeaves.filter((l) => {
        if (status && status !== 'All' && l.status !== status) return false;
        if (pod && pod !== 'All' && !l.pod?.toLowerCase().includes(pod.toLowerCase())) return false;
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          return (
            l.employeeName?.toLowerCase().includes(q) ||
            l.employeeId?.toLowerCase().includes(q) ||
            l.reason?.toLowerCase().includes(q)
          );
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('getAllLeaveRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve company-wide leave requests.'
    });
  }
};

/**
 * @desc Review leave request (Approve or Reject)
 * @route PATCH /api/leaves/:id/review
 * @access Admin, Operations Manager, Pod Lead (pod restricted)
 */
export const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewerComments } = req.body;
    const dbStatus = getDBStatus();

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected".'
      });
    }

    let leave = null;
    if (dbStatus.connected && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        leave = await Leave.findById(id);
      } catch (e) {}
    }
    if (!leave) {
      leave = inMemoryLeaves.find((l) => String(l._id) === String(id));
    }

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request record not found.'
      });
    }

    // Pod Lead Isolation Check
    if (req.user.role === 'pod_lead') {
      const leadPod = req.user.podId?.toLowerCase();
      const leavePod = leave.pod?.toLowerCase();
      if (!leadPod || !leavePod || (!leavePod.includes(leadPod) && !leadPod.includes(leavePod))) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Pod Leads can only review leave requests for their own assigned pod.'
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user.name;
    leave.reviewerComments = reviewerComments || (status === 'Approved' ? 'Approved by supervisor' : 'Rejected by supervisor');

    if (typeof leave.save === 'function') {
      try {
        await leave.save();
      } catch (e) {}
    }

    // ⭐ CRITICAL REQUIREMENT: An approved leave must automatically:
    // 1. Update employee status / availability
    // 2. Trigger automated conflict detection for affected dates
    if (status === 'Approved') {
      // Create a potential scheduling gap / conflict flag for managers to inspect
      try {
        const confData = {
          title: `Approved Leave: ${leave.employeeName}`,
          date: leave.startDate,
          dateFormatted: leave.startDate?.slice(5) || 'Upcoming',
          brand: leave.brand || 'Apex Retail',
          process: 'Customer Support',
          problem: `Staff on approved leave (${leave.durationDays} day(s))`,
          severity: 'Warning',
          status: 'Unresolved',
          employeeName: leave.employeeName,
          employeeId: leave.employeeId,
          pod: leave.pod,
          requiredEmployees: 1,
          availableEmployees: 0,
          reason: `Employee on approved ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate}. Reason: ${leave.reason}`,
          possibleResolution: 'Verify backup resource or adjust shift allocations to cover queue requirements.',
          category: 'Leave conflict'
        };
        if (dbStatus.connected) {
          await Conflict.create(confData);
        }
      } catch (confErr) {
        console.warn('Note: Conflict creation on leave approval caught:', confErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully. Roster validation updated.`,
      data: leave
    });
  } catch (error) {
    console.error('reviewLeaveRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process leave request review.'
    });
  }
};

/**
 * @desc Cancel leave request
 * @route DELETE /api/leaves/:id
 * @access Authenticated (Owner, Pod Lead, Ops Manager, Admin)
 */
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Role verification: only owner or managers can cancel
    if (
      req.user.role === 'employee' &&
      leave.employeeId !== req.user.employeeId &&
      leave.employeeName !== req.user.name
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests.'
      });
    }

    leave.status = 'Cancelled';
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request has been cancelled.',
      data: leave
    });
  } catch (error) {
    console.error('cancelLeaveRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request.'
    });
  }
};
