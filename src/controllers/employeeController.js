import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import RosterAssignment from '../models/RosterAssignment.js';
import Brand from '../models/Brand.js';
import Pod from '../models/Pod.js';
import Process from '../models/Process.js';
import { getDBStatus } from '../config/db.js';
import { seedEmployees, seedLeaves } from '../data/seedData.js';
import { brandProcessCalendars } from '../services/rosterEngine.js';

// In-memory working copy
let inMemoryEmployeeList = [...seedEmployees];

// GET /api/employees
export const getEmployees = async (req, res) => {
  try {
    const { pod, brand, status, search } = req.query;
    const dbStatus = getDBStatus();
    let employees = [];

    if (dbStatus.connected) {
      const query = {};
      if (pod && pod !== 'All Pods') query.pod = pod;
      if (brand && brand !== 'All Brands') query.brand = brand;
      if (status && status !== 'All') query.status = status;
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { employeeId: regex }, { email: regex }, { designation: regex }];
      }

      employees = await Employee.find(query).sort({ createdAt: -1 });
      if (!employees.length && !pod && !brand && !status && !search) {
        employees = inMemoryEmployeeList;
      }
    } else {
      employees = [...inMemoryEmployeeList];
      if (pod && pod !== 'All Pods') {
        employees = employees.filter((e) => e.pod === pod);
      }
      if (brand && brand !== 'All Brands') {
        employees = employees.filter((e) => e.brand === brand);
      }
      if (status && status !== 'All') {
        employees = employees.filter((e) => e.status === status);
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        employees = employees.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.employeeId.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            (e.designation && e.designation.toLowerCase().includes(q))
        );
      }
    }

    // Role-based data isolation on backend
    if (req.user?.role === 'pod_lead' && req.user.podId) {
      const podMatch = req.user.podId.replace(/[()]/g, '\\$&').slice(0, 8).toLowerCase();
      employees = employees.filter((e) => (e.pod || '').toLowerCase().includes(podMatch));
    } else if (req.user?.role === 'employee' && req.user.employeeId) {
      employees = employees.filter((e) => e.employeeId === req.user.employeeId || e.email === req.user.email);
    }

    // Summary counts
    const totalCount = employees.length;
    const activeCount = employees.filter((e) => e.status === 'Active').length;
    const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
    const inactiveCount = employees.filter((e) => e.status === 'Inactive').length;

    res.status(200).json({
      success: true,
      count: totalCount,
      summary: {
        total: totalCount,
        active: activeCount,
        onLeave: onLeaveCount,
        inactive: inactiveCount
      },
      data: employees
    });
  } catch (error) {
    console.error('getEmployees Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/:id
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let emp = null;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        emp = await Employee.findById(id);
      }
      if (!emp) {
        emp = await Employee.findOne({ employeeId: id });
      }
    }

    if (!emp) {
      emp = inMemoryEmployeeList.find((e) => e.employeeId === id || e._id === id);
    }

    if (!emp) {
      return res.status(404).json({ success: false, message: `Employee ${id} not found.` });
    }

    // 1. Leave History
    let leaves = [];
    if (dbStatus.connected) {
      leaves = await Leave.find({
        $or: [{ employeeId: emp.employeeId }, { employeeName: emp.name }]
      }).sort({ startDate: -1 });
    }
    if (!leaves.length) {
      leaves = seedLeaves.filter((l) => l.employeeId === emp.employeeId || l.employeeName === emp.name);
    }

    // 2. Monthly Schedule / Roster Assignments
    let assignments = [];
    if (dbStatus.connected) {
      assignments = await RosterAssignment.find({ employeeId: emp.employeeId }).sort({ dayOfMonth: 1 });
    }

    // 3. Brand & Process metadata
    const brandSchedule = brandProcessCalendars[emp.brand] || {};
    const processInfo = brandSchedule[emp.process] || {
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultShift: emp.shift || 'Day (08:00 - 17:00)',
      is24x7: false
    };

    res.status(200).json({
      success: true,
      data: {
        personal: emp,
        brandAssignment: {
          brand: emp.brand,
          pod: emp.pod,
          process: emp.process,
          shift: emp.shift,
          operatingDays: processInfo.operatingDays,
          is24x7: processInfo.is24x7,
          slaTarget: '99.2% Standard'
        },
        availability: {
          currentStatus: emp.status,
          weeklyOffDays: emp.weeklyOffDays || ['Saturday', 'Sunday'],
          shiftPattern: emp.shift,
          totalApprovedLeaves: leaves.filter((l) => l.status === 'Approved').length,
          leaveHistory: leaves
        },
        monthlySchedule: {
          month: 'November 2026',
          assignments: assignments
        }
      }
    });
  } catch (error) {
    console.error('getEmployeeById Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/employees (Add Employee)
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      employeeId,
      email,
      designation,
      pod,
      joiningDate,
      status = 'Active',
      brand,
      process: procName,
      shift,
      phone,
      address,
      weeklyOffDays
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    const assignedId =
      employeeId && employeeId.trim()
        ? employeeId.trim()
        : `EMP${Math.floor(100 + Math.random() * 900)}`;

    const newEmpData = {
      name: name.trim(),
      employeeId: assignedId,
      email: email.trim().toLowerCase(),
      designation: designation || 'Support Executive',
      role: designation || 'Support Executive',
      pod: pod || 'Pod Alpha (Inbound Core)',
      brand: brand || 'Apex Retail',
      process: procName || 'L1 Inbound Voice Support',
      joiningDate: joiningDate || '01-01-2026',
      status: status || 'Active',
      shift: shift || 'Day (08:00 - 17:00)',
      phone: phone || '+91 98765-43210',
      address: address || 'Standard Operational Center',
      weeklyOffDays: weeklyOffDays || ['Saturday', 'Sunday'],
      emergencyContact: {
        name: 'Primary Contact',
        relation: 'Family',
        phone: '+91 98765-00000'
      }
    };

    const dbStatus = getDBStatus();
    let savedEmp = null;

    if (dbStatus.connected) {
      // Check duplicate ID
      const existing = await Employee.findOne({ employeeId: assignedId });
      if (existing) {
        return res.status(400).json({ success: false, message: `Employee ID ${assignedId} already exists.` });
      }
      savedEmp = await Employee.create(newEmpData);
    } else {
      const exists = inMemoryEmployeeList.some((e) => e.employeeId === assignedId);
      if (exists) {
        return res.status(400).json({ success: false, message: `Employee ID ${assignedId} already exists.` });
      }
      inMemoryEmployeeList = [newEmpData, ...inMemoryEmployeeList];
      savedEmp = newEmpData;
    }

    res.status(201).json({
      success: true,
      message: `Employee ${name} (${assignedId}) created successfully!`,
      data: savedEmp
    });
  } catch (error) {
    console.error('createEmployee Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/employees/:id (Edit Employee)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.designation && !updateData.role) updateData.role = updateData.designation;

    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        updated = await Employee.findByIdAndUpdate(id, updateData, { new: true });
      }
      if (!updated) {
        updated = await Employee.findOneAndUpdate({ employeeId: id }, updateData, { new: true });
      }
    }

    const memIdx = inMemoryEmployeeList.findIndex((e) => e.employeeId === id || e._id === id);
    if (memIdx !== -1) {
      inMemoryEmployeeList[memIdx] = { ...inMemoryEmployeeList[memIdx], ...updateData };
      if (!updated) updated = inMemoryEmployeeList[memIdx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: `Employee ${id} not found.` });
    }

    res.status(200).json({
      success: true,
      message: `Employee ${updated.name} updated successfully!`,
      data: updated
    });
  } catch (error) {
    console.error('updateEmployee Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/employees/:id/status (Deactivate or Activate)
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Inactive' or 'On Leave'

    const targetStatus = status || 'Inactive';
    const dbStatus = getDBStatus();
    let updated = null;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        updated = await Employee.findByIdAndUpdate(id, { status: targetStatus }, { new: true });
      }
      if (!updated) {
        updated = await Employee.findOneAndUpdate({ employeeId: id }, { status: targetStatus }, { new: true });
      }
    }

    const memIdx = inMemoryEmployeeList.findIndex((e) => e.employeeId === id || e._id === id);
    if (memIdx !== -1) {
      inMemoryEmployeeList[memIdx].status = targetStatus;
      if (!updated) updated = inMemoryEmployeeList[memIdx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: `Employee ${id} not found.` });
    }

    res.status(200).json({
      success: true,
      message: `Employee status changed to ${targetStatus}`,
      data: updated
    });
  } catch (error) {
    console.error('toggleEmployeeStatus Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/employees/:id
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let deleted = false;

    if (dbStatus.connected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Employee.findByIdAndDelete(id);
        deleted = true;
      } else {
        await Employee.findOneAndDelete({ employeeId: id });
        deleted = true;
      }
    }

    inMemoryEmployeeList = inMemoryEmployeeList.filter((e) => e.employeeId !== id && e._id !== id);

    res.status(200).json({
      success: true,
      message: `Employee ${id} has been removed from directory.`
    });
  } catch (error) {
    console.error('deleteEmployee Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/:id/roster
export const getEmployeeRoster = async (req, res) => {
  try {
    const { id } = req.params;
    const { month = 'November 2026' } = req.query;

    const dbStatus = getDBStatus();
    let assignments = [];

    if (dbStatus.connected) {
      assignments = await RosterAssignment.find({ employeeId: id, month }).sort({ dayOfMonth: 1 });
    }

    res.status(200).json({
      success: true,
      employeeId: id,
      month,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('getEmployeeRoster Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/:id/leaves
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();
    let leaves = [];

    if (dbStatus.connected) {
      leaves = await Leave.find({ employeeId: id }).sort({ startDate: -1 });
    }
    if (!leaves.length) {
      leaves = seedLeaves.filter((l) => l.employeeId === id);
    }

    res.status(200).json({
      success: true,
      employeeId: id,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('getEmployeeLeaves Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
