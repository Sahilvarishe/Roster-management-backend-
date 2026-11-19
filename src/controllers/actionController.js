import Employee from '../models/Employee.js';
import Brand from '../models/Brand.js';
import Pod from '../models/Pod.js';
import Roster from '../models/Roster.js';
import Leave from '../models/Leave.js';
import { getDBStatus } from '../config/db.js';
import { getInMemoryState, updateInMemoryState } from './dashboardController.js';

// POST /api/actions/generate-roster
export const generateRoster = async (req, res) => {
  try {
    const { month = 'November 2026', optimizationStrategy = 'Balanced Coverage', targetPods = 'All Pods' } = req.body;
    const dbStatus = getDBStatus();

    const newAssigned = 1140;
    const newTotalRequired = 1200;
    const newCompletionRate = +((newAssigned / newTotalRequired) * 100).toFixed(1); // 95.0%

    let updatedRoster;
    if (dbStatus.connected) {
      updatedRoster = await Roster.findOneAndUpdate(
        { month },
        {
          assignedShifts: newAssigned,
          totalRequiredShifts: newTotalRequired,
          completionRate: newCompletionRate,
          status: 'Published',
          lastGeneratedAt: new Date()
        },
        { new: true, upsert: true }
      );
    } else {
      updateInMemoryState('memoryRoster', () => ({
        month,
        monthIndex: 10,
        year: 2026,
        totalRequiredShifts: newTotalRequired,
        assignedShifts: newAssigned,
        completionRate: newCompletionRate,
        status: 'Published'
      }));
      updatedRoster = getInMemoryState().memoryRoster;
    }

    res.status(200).json({
      success: true,
      message: `Roster for ${month} successfully generated with ${optimizationStrategy} strategy for ${targetPods}!`,
      data: updatedRoster
    });
  } catch (error) {
    console.error('generateRoster Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/actions/add-employee
export const addEmployee = async (req, res) => {
  try {
    const { name, email, role, brand, pod, process: procName, shift, phone, weeklyOffDays } = req.body;

    if (!name || !email || !brand || !pod) {
      return res.status(400).json({ success: false, message: 'Name, email, brand, and pod are required.' });
    }

    const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmpData = {
      employeeId,
      name,
      email,
      role: role || 'Operations Associate',
      brand,
      pod,
      process: procName || 'L1 General Queue',
      status: 'Active',
      shift: shift || 'Day (08:00 - 17:00)',
      phone: phone || '',
      weeklyOffDays: weeklyOffDays || ['Saturday', 'Sunday']
    };

    const dbStatus = getDBStatus();
    let savedEmployee;

    if (dbStatus.connected) {
      savedEmployee = await Employee.create(newEmpData);
      await Brand.findOneAndUpdate({ name: brand }, { $inc: { assignedEmployeesCount: 1 } });
    } else {
      updateInMemoryState('memoryEmployees', (list) => [newEmpData, ...list]);
      savedEmployee = newEmpData;
    }

    res.status(201).json({
      success: true,
      message: `Employee ${name} successfully enrolled with ID ${employeeId}`,
      data: savedEmployee
    });
  } catch (error) {
    console.error('addEmployee Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/actions/add-brand
export const addBrand = async (req, res) => {
  try {
    const { name, code, color, targetCoverage, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Brand name and code are required.' });
    }

    const newBrandData = {
      name,
      code: code.toUpperCase(),
      color: color || '#6366f1',
      status: 'Active',
      targetCoverage: Number(targetCoverage) || 95,
      currentCoverage: 92.0,
      assignedEmployeesCount: 0,
      operationalPodsCount: 1,
      activeProcessesCount: 1,
      description: description || ''
    };

    const dbStatus = getDBStatus();
    let savedBrand;

    if (dbStatus.connected) {
      savedBrand = await Brand.create(newBrandData);
    } else {
      updateInMemoryState('memoryBrands', (list) => [...list, newBrandData]);
      savedBrand = newBrandData;
    }

    res.status(201).json({
      success: true,
      message: `Brand ${name} (${code.toUpperCase()}) created successfully`,
      data: savedBrand
    });
  } catch (error) {
    console.error('addBrand Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/actions/manage-availability
export const manageAvailability = async (req, res) => {
  try {
    const { employeeId, employeeName, brand, pod, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeName || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Employee name, start date, and end date are required.' });
    }

    const leaveData = {
      employeeId: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeName,
      brand: brand || 'Apex Retail',
      pod: pod || 'Pod Alpha (Inbound Core)',
      leaveType: leaveType || 'Casual',
      startDate,
      endDate,
      durationDays: Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1),
      status: 'Approved',
      reason: reason || 'Availability adjustment requested by Ops Manager'
    };

    const dbStatus = getDBStatus();
    let savedLeave;

    if (dbStatus.connected) {
      savedLeave = await Leave.create(leaveData);
      await Employee.findOneAndUpdate({ name: employeeName }, { status: 'On Leave' });
    } else {
      const entry = { ...leaveData, _id: `mem-leave-${Date.now()}` };
      updateInMemoryState('memoryLeaves', (list) => [entry, ...list]);
      savedLeave = entry;
    }

    res.status(201).json({
      success: true,
      message: `Availability updated & leave logged for ${employeeName}`,
      data: savedLeave
    });
  } catch (error) {
    console.error('manageAvailability Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
